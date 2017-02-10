var async = require('async');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var dbImport = require(__dirname + '/../dbImport.js');
var imgImport = require(__dirname + '/../imgImport.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadPopularFilmsPages(function (films) {
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
        },
        function(err) {
            if (err) {
                throw err;
            }

            console.log('All popular films done');
        });
    });
};

module.exports = {
    start : start
};
