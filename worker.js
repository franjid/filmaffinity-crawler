var ini = require('ini');
var fs = require('graceful-fs');
var Log = require('log');
var amqp = require('amqplib/callback_api');

global.parameters = ini.parse(fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')).parameters;
global.log = new Log('debug', fs.createWriteStream('worker.log'));

var amqpConn = null;

function start() {
  amqp.connect(global.parameters.rabbitmq_dsn + '?heartbeat=60', function (err, conn) {
    if (err) {
      console.error('[AMQP]', err.message);
      return setTimeout(start, 1000);
    }

    conn.on('error', function (err) {
      if (err.message !== 'Connection closing') {
        console.error('[AMQP] conn error', err.message);
      }
    });

    console.log('[AMQP] connected');
    amqpConn = conn;

    startWorker();
  });
}

// A worker that acks messages only if processed succesfully
function startWorker() {
  amqpConn.createChannel(function (err, ch) {
    ch.on('error', function (err) {
      console.error('[AMQP] channel error', err.message);
    });

    ch.on('close', function () {
      console.log('[AMQP] channel closed');
      process.exit(0);
    });

    ch.prefetch(10);

    ch.assertQueue(global.parameters.queue_name, {durable: true}, function (err, _ok) {
      ch.consume(global.parameters.queue_name, processMsg, {noAck: false});
      console.log('Worker running. Waiting for jobs...');
    });

    function processMsg(msg) {
      work(msg, function (ok) {

        try {
          if (ok === null) {
            ch.ack(msg);
          } else if (ok) {
            console.log('\x1b[32m', '[Job completed]');
            ch.ack(msg);
          } else {
            ch.reject(msg, true);
          }
        } catch (e) {
          console.error('[AMQP] error', err);
        }
      });
    }
  });
}

function work(msg, cb) {
  console.log('\x1b[36m', 'Processing job: ', msg.content.toString());

  var payload = JSON.parse(msg.content);

  switch (payload.eventName) {
    case 'UserAddedEvent':
      console.log('\x1b[36m', '[Handling UserAddedEvent for user]');

      var userFriendsCrawler = require(__dirname + '/lib/actions/user_friends.js');

      userFriendsCrawler.start(payload.userIdFilmaffinity, (friendsIds) => {
        console.log('Now we should crawl last films from these users');
        console.log(friendsIds);
        cb(true);
      })

      break;
    default:
      console.log('\x1b[31m', 'EventName in payload is not recognized. Ignoring message');
      cb(null);
      return;
  }
}

start();
