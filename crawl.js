var ini = require('ini');
var fs = require('fs');
var mysql = require('mysql');
var async = require('async');
var request = require('request');
var rangegen = require('rangegen');
var useragent = require('random-useragent');
var cheerio = require('cheerio');

var crawler = require(__dirname + '/lib/crawler.js');

global.parameters = ini.parse(
    fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

/*
const dbConnection = mysql.createConnection({
    host: parameters.host,
    user: parameters.db_user,
    password: parameters.db_password,
    database: parameters.db_name
});
dbConnection.connect();
*/
//getToken(parameters, citiesToImport);


var charsToLookFor = [];
var letters = rangegen('A', 'Z');

charsToLookFor.push('res'); // 'res' is what they used for '*'
charsToLookFor.push('0-9');
//charsToLookFor = charsToLookFor.concat(letters);

var importFilm = function(film) {
    console.log(film);
    console.log('IMPORT FILM');
};

async.eachSeries(charsToLookFor, function (char, callback) {
    console.log('Getting number of pages for ' + char);

    crawler.getNumPagesOfFilmsStartingWithChar(char, function (char, numPages) {
        console.log('Start crawling for char ' + char + ' ' + numPages + ' pages');

        for (var page = 1; page <= numPages; page++) {
            crawler.loadFilmsPages(char, page, function (filmId) {
                crawler.loadFilm(filmId, function (film) {
                    importFilm(film);
                })
            });
        }
    });

    callback();
});




