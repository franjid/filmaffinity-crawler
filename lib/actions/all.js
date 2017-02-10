var async = require('async');
var rangegen = require('rangegen');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var dbImport = require(__dirname + '/../dbImport.js');
var imgImport = require(__dirname + '/../imgImport.js');

var start = function() {
    var dbPool = db.getPool(),
        charsToLookFor = [],
        letters = rangegen('A', 'Z');

    charsToLookFor.push('0-9');
    charsToLookFor = charsToLookFor.concat(letters);

    async.forEachLimit(charsToLookFor, 1, function (char, getCharNumberFilmPages) {
            global.log.info('Getting number of pages for ' + char);

            crawler.getNumPagesOfFilmsStartingWithChar(char, function (char, numPages) {
                var infoMessage = 'Crawling films starting with char [' + char + '] | ' + numPages + ' pages:';
                global.log.info(infoMessage);
                console.log(infoMessage);

                var bar = new progressBar(':bar', { total: parseInt(numPages), clear: true });
                var pages = rangegen(1, numPages);

                async.forEachLimit(pages, 2, function (page, loadCharFilmPage) {
                    crawler.loadFilmsPage('/es/allfilms_' + char + '_' + page + '.html', function (films) {
                        async.each(films, function(filmId, loadFilm) {
                            crawler.loadFilm(filmId, function (film) {
                                if (!isNaN(film.year)) { // Films with no data
                                    dbPool.getConnection(function(err, dbConnection) {
                                        dbImport.filmExistsInDb(dbConnection, film.id, function(filmExists) {
                                            if (!filmExists) {
                                                imgImport.importPoster(film);
                                            }
                                        });

                                        dbImport.importFilm(dbConnection, film, function() {
                                            dbConnection.release();
                                        });
                                    });
                                }
                            });

                            loadFilm();
                        }, function(err) {
                            if (err) {
                                throw err;
                            }

                            global.log.info('All film ids from page ' +
                                page + ' in [' + char + '] are imported (total pages ' + numPages + ')'
                            );
                            bar.tick();
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
            if (err) {
                throw err;
            }

            console.log('All done');
        }
    );
};

module.exports = {
    start : start
};
