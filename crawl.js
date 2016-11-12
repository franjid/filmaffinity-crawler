var ini = require('ini');
var fs = require('fs');
var Log = require('log');
var mysql = require('mysql');
var async = require('async');
var rangegen = require('rangegen');

var crawler = require(__dirname + '/lib/crawler.js');
var dbImport = require(__dirname + '/lib/dbImport.js');
var imgImport = require(__dirname + '/lib/imgImport.js');

global.log = new Log('debug', fs.createWriteStream('crawler.log'));

global.parameters = ini.parse(
    fs.readFileSync(__dirname + '/config/parameters.ini', 'utf-8')
).parameters;

global.filmError = {};

var dbPool = mysql.createPool({
    host: parameters.host,
    user: parameters.db_user,
    password: parameters.db_password,
    database: parameters.db_name,
    connectionLimit : 100
});


var charsToLookFor = [];
var letters = rangegen('A', 'Z');

//charsToLookFor.push('res'); // 'res' is what they used for '*'
charsToLookFor.push('0-9');
charsToLookFor = charsToLookFor.concat(letters);

async.forEachLimit(charsToLookFor, 1, function (char, getCharNumberFilmPages) {
    global.log.info('Getting number of pages for ' + char);

    crawler.getNumPagesOfFilmsStartingWithChar(char, function (char, numPages) {
        global.log.info('Start crawling for char ' + char + ' ' + numPages + ' pages');
        var pages = rangegen(1, numPages);

        async.forEachLimit(pages, 2, function (page, loadCharFilmPage) {
            crawler.loadFilmsPages(char, page, function (films) {
                async.each(films, function(filmId, loadFilm) {
                     crawler.loadFilm(filmId, function (film) {
                         if (!isNaN(film.year)) { // Films with no data: http://www.filmaffinity.com/es/film111997.html
                            dbPool.getConnection(function(err, dbConnection) {
                                dbImport.importFilm(dbConnection, film, function() {
                                    dbConnection.release();
                                });
                            });

                            imgImport.importPoster(film);
                         }
                     });

                    loadFilm();
                }, function(err) {
                    global.log.info('All film ids from page ' +
                        page + ' in [' + char + '] are imported (total pages ' + numPages + ')'
                    );
                    loadCharFilmPage();
                });
            });

            if (page == numPages) {
                getCharNumberFilmPages();
            }
        });
    });
},
    function (err) {
        console.log('All done');
    }
);
