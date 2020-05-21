var ini = require('ini');
var fs = require('graceful-fs');
var Log = require('log');

var arguments = require(__dirname + '/lib/arguments.js');

global.log = new Log('debug', fs.createWriteStream('crawler.log'));

global.parameters = ini.parse(
    fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

global.filmError = {};

arguments.getAction(function(action, filmId) {
    var crawler = require(__dirname + '/lib/actions/' + action + '.js');

    if (action === 'id') {
        crawler.start(filmId);
    } else {
        crawler.start();
    }
});
