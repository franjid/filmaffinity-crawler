var ini = require('ini');
var fs = require('graceful-fs');
var Log = require('log');

var arguments = require(__dirname + '/lib/arguments.js');

global.log = new Log(
  'debug',
  fs.createWriteStream(__dirname + '/crawler.log', {
    flags: 'a',
    encoding: null,
    mode: 0666
  })
);

global.parameters = ini.parse(
  fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

global.filmError = {};

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

arguments.getAction(function (action, argument) {
  var crawler = require(__dirname + '/lib/actions/' + action + '.js');

  process.on('uncaughtException', function (err) {
    // console.log('UNCAUGHT EXCEPTION - keeping process alive:', err);
  });

  if (action === 'user_friends' || action === 'id') {
    crawler.start(argument);
  } else if (action === 'new_platform') {
    crawler.start(argument);
  } else {
    crawler.start();
  }
});
