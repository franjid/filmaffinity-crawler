const ini = require('ini');
const fs = require('graceful-fs');
const Log = require('log');
const amqp = require('amqplib/callback_api');
var db = require(__dirname + '/lib/db.js');
var dbImport = require(__dirname + '/lib/dbImport.js');

global.parameters = ini.parse(fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')).parameters;
global.log = new Log(
  'debug',
  fs.createWriteStream(__dirname + '/worker.log', {
    flags: 'a',
    encoding: null,
    mode: 0666
  })
);

const dbPool = db.getPool();
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

function buildFriendsSyncFinishedNotificationMessage(token) {
  return {
    'message': {
      'token': token,
      'notification': {
        'title': 'Sincronización de amigos finalizada',
        'body': 'Ya puedes ver las últimas votaciones de tus amigos'
      },
      'data': {
        'action': 'friends_sync_finished'
      },
      'android': {
        'notification': {
          'sound': 'default',
          'click_action': 'FCM_PLUGIN_ACTIVITY'
        },
      }
    }
  };
}

function buildFriendsRatedNewFilmsNotificationMessage(token) {
  return {
    'message': {
      'token': token,
      'notification': {
        'title': '¡Tus amigos han votado películas nuevas!',
        'body': 'No te pierdas las nuevas votaciones de tus amigos'
      },
      'data': {
        'action': 'friends_new_ratings'
      },
      'android': {
        'notification': {
          'sound': 'default',
          'click_action': 'FCM_PLUGIN_ACTIVITY'
        },
      }
    }
  };
}

function handleUserAddedEvent(payload, cb) {
  const userFriendsCrawler = require(__dirname + '/lib/actions/user_friends.js');
  const userFriendsRatingsCrawler = require(__dirname + '/lib/actions/user_friends_ratings.js');
  const userFriendsFilmsCrawler = require(__dirname + '/lib/actions/user_friends_films.js');
  const notifications = require('@franjid/easy-firebase-notifications');

  console.log('\x1b[36m', '[Handling ' + payload.eventName + ']');
  console.log('\x1b[37m', '\tImporting user friends...');

  let userId = payload.userIdFilmaffinity;

  userFriendsCrawler.start(userId, (friendsIds) => {
    console.log('\x1b[37m', '\tImporting last user friends ratings...');

    userFriendsRatingsCrawler.start(friendsIds, () => {
      dbPool.getConnection(function (err, dbConnection) {
        dbImport.setUserLastRatingNotification(dbConnection, userId, function () {
          dbConnection.destroy();
        });
      });

      dbPool.getConnection(function (err, dbConnection) {
        if (err) {
          console.log(film);
          global.log.error(err);
          throw err;
        }

        console.log('\x1b[37m', '\tImporting last friends films...');
        userFriendsFilmsCrawler.start(); // We don't care when this finish

        dbImport.getUser(dbConnection, userId, function (user) {
          dbConnection.destroy();

          if (!user.length || !user[0].appNotificationsToken) {
            cb(true);
            return;
          }

          const token = user[0].appNotificationsToken;

          notifications.init(
            global.parameters.notifications_project_id,
            __dirname + global.parameters.notifications_service_account
          ).then(() => {
            notifications.sendMessage(buildFriendsSyncFinishedNotificationMessage(token)).then(function (result) {
              console.log('\x1b[37m', '\tNotification sent');
              result = JSON.parse(result);

              if (result.error !== undefined) {
                console.log('\x1b[31m', '\tError sending notification to user ' + userId + ':');
                console.log(result.error);
              }

              cb(true);
            }, function (err) {
              console.log('\x1b[31m', '\tError sending notification to user ' + userId + ':');
              console.log(err);
              cb(true);
            });
          });
        });
      });
    });
  })
}

function handleUserFriendsRatedNewFilmsEvent(payload, cb) {
  const notifications = require('@franjid/easy-firebase-notifications');

  console.log('\x1b[36m', '[Handling ' + payload.eventName + ']');

  let userId = payload.userIdFilmaffinity;

  dbPool.getConnection(function (err, dbConnection) {
    if (err) {
      console.log(film);
      global.log.error(err);
      throw err;
    }

    dbPool.getConnection(function (err, dbConnection) {
      dbImport.setUserLastRatingNotification(dbConnection, userId, function () {
        dbConnection.destroy();
      });
    });

    dbImport.getUser(dbConnection, userId, function (user) {
      dbConnection.destroy();

      if (!user.length || !user[0].appNotificationsToken) {
        cb(true);
        return;
      }

      const token = user[0].appNotificationsToken;

      notifications.init(
        global.parameters.notifications_project_id,
        __dirname + global.parameters.notifications_service_account
      ).then(() => {
        notifications.sendMessage(buildFriendsRatedNewFilmsNotificationMessage(token)).then(function (result) {
          console.log('\x1b[37m', '\tNotification sent');
          result = JSON.parse(result);

          if (result.error !== undefined) {
            console.log('\x1b[31m', '\tError sending notification to user ' + userId + ':');
            console.log(result.error);
          }

          cb(true);
        }, function (err) {
          console.log('\x1b[31m', '\tError sending notification to user ' + userId + ':');
          console.log(err);
          cb(true);
        });
      });
    });
  });
}

function work(msg, cb) {
  console.log('\x1b[36m', 'Processing job: ', msg.content.toString());

  var payload = JSON.parse(msg.content);

  switch (payload.eventName) {
    case 'UserAddedEvent':
    case 'UserUpdatedEvent':
      handleUserAddedEvent(payload, cb);
      break;
    case 'UserFriendsNewFilmsRatedEvent':
      handleUserFriendsRatedNewFilmsEvent(payload, cb);
      break;
    default:
      console.log('\x1b[31m', 'EventName in payload is not recognized. Ignoring message');
      cb(null);
      return;
  }
}

start();
