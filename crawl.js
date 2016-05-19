var ini = require('ini');
var fs = require('fs');
var mysql = require('mysql');
var async = require('async');
var request = require('request');
var rangegen = require('rangegen');
var useragent = require('random-useragent');
var cheerio = require('cheerio');

var crawler = require(__dirname + '/lib/crawler.js');
var dbImport = require(__dirname + '/lib/dbImport.js');

global.parameters = ini.parse(
    fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

global.dbConnection = mysql.createConnection({
    host: parameters.host,
    user: parameters.db_user,
    password: parameters.db_password,
    database: parameters.db_name
});
global.dbConnection.connect();

var charsToLookFor = [];
var letters = rangegen('A', 'Z');

charsToLookFor.push('res'); // 'res' is what they used for '*'
charsToLookFor.push('0-9');
charsToLookFor.push('A');
//charsToLookFor = charsToLookFor.concat(letters);

async.forEachLimit(charsToLookFor, 1, function (char, getCharNumberFilmPages) {
    console.log('Getting number of pages for ' + char);

    crawler.getNumPagesOfFilmsStartingWithChar(char, function (char, numPages) {
        console.log('Start crawling for char ' + char + ' ' + numPages + ' pages');
        var pages = rangegen(1, numPages);

        async.forEachLimit(pages, 2, function (page, loadCharFilmPage) {
            crawler.loadFilmsPages(char, page, function (films) {
                async.each(films, function(filmId, loadFilm) {
                     crawler.loadFilm(filmId, function (film) {
                        dbImport.importFilm(film);
                     });

                    loadFilm();
                }, function(err) {
                    console.log('All film ids from page ' + page + ' are imported');
                    loadCharFilmPage();
                });
            });

            if (page == numPages) {
                getCharNumberFilmPages();
            }
        });
    });
});
