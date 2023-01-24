var async = require('async');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadPopularFilmsPage('/es/mostvisited.php', function (films) {
        dbPool.getConnection(function(err, dbConnection) {
            if (err) {
                console.log(film);
                global.log.error(err);
                throw err;
            }

            dbImport.clearFilmPopular(dbConnection, function() {
                dbConnection.destroy();

                async.each(films, function(film) {
                    generalAction.addFilm(dbPool, film.id, function() {
                        dbPool.getConnection(function(err, dbConnection) {
                            if (err) {
                                console.log(film);
                                global.log.error(err);
                                throw err;
                            }

                            dbImport.insertFilmPopular(dbConnection, film, function() {
                                dbConnection.destroy();
                            });
                        });
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }

                    console.log('All popular films done');
                });
            });
        });

    });
};

module.exports = {
    start : start
};
