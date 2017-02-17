var async = require('async');

var crawler = require(__dirname + '/../crawler.js');
var dbImport = require(__dirname + '/../dbImport.js');
var imgImport = require(__dirname + '/../imgImport.js');

var addFilm = function(dbPool, filmId) {
    crawler.loadFilm(filmId, function (film) {
        if (!isNaN(film.year)) { // Films with no data
            dbPool.getConnection(function(err, dbConnection) {
                if (err) {
                    console.log(film);
                    global.log.error(err);
                    throw err;
                }

                dbImport.filmExistsInDb(dbConnection, film.id, function(filmExists) {
                    if (!filmExists) {
                        imgImport.importPoster(film);
                    }

                    dbImport.importFilm(dbConnection, film, function() {
                        dbConnection.destroy();
                    });
                });
            });
        }
    });
};

module.exports = {
    addFilm : addFilm
};
