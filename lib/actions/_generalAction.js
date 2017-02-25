var async = require('async');

var crawler = require(__dirname + '/../crawler.js');
var dbImport = require(__dirname + '/../dbImport.js');
var imgImport = require(__dirname + '/../imgImport.js');

var addFilm = function(dbPool, filmId) {
    crawler.loadFilm(filmId, function (errorLoadingFilm, film) {
        dbPool.getConnection(function(err, dbConnection) {
            if (err) {
                console.log(film);
                global.log.error(err);
                throw err;
            }

            if (errorLoadingFilm) {
                dbImport.insertFailedCrawlFilm(dbConnection, filmId, function() {
                    dbConnection.destroy();
                });
            } else if (!isNaN(film.year)) { // Confirm that film has basic data
                dbImport.filmExistsInDb(dbConnection, film.id, function(filmExists) {
                    if (!filmExists) {
                        imgImport.importPoster(film);
                    }

                    dbImport.importFilm(dbConnection, film, function() {
                        dbConnection.destroy();
                    });
                });
            } else {
                dbConnection.destroy();
            }
        });
    });
};

module.exports = {
    addFilm : addFilm
};
