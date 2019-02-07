var async = require('async');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var generalAction = require(__dirname + '/_generalAction.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function() {
    var dbPool = db.getPool();

    dbPool.getConnection(function(err, dbConnection) {
        if (err) {
            console.log(film);
            global.log.error(err);
            throw err;
        }

        dbImport.getFailedCrawlFilm(dbConnection, function(films) {
            dbConnection.destroy();

            var bar = new progressBar(':bar', { total: parseInt(films.length), clear: true });

            async.forEachLimit(films, 10, function(film, cb) {
                generalAction.addFilm(dbPool, film.idFilm, function() {

                    dbPool.getConnection(function(err, dbConnection) {
                        if (err) {
                            console.log(film);
                            global.log.error(err);
                            throw err;
                        }

                        dbImport.deleteFailedCrawlFilm(dbConnection, film.idFilm, function() {
                            dbConnection.destroy();
                            bar.tick();
                            cb();
                        });
                    });
                });
            }, function(err) {
                if (err) {
                    throw err;
                }

                console.log('All failed films done');
            });
        });
    });
};

module.exports = {
    start : start
};
