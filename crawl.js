var ini = require('ini');
var fs = require('graceful-fs');
var Log = require('log');

var arguments = require(__dirname + '/lib/arguments.js');

global.log = new Log('debug', fs.createWriteStream('crawler.log'));

global.parameters = ini.parse(
    fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

global.filmError = {};

arguments.getAction(function(action) {
    var crawler;

    switch (action) {
        case 'all':
            crawler = require(__dirname + '/lib/actions/all.js');
            break;
        case 'popular':
            crawler = require(__dirname + '/lib/actions/popular.js');
            break;
    }

    crawler.start();
});
