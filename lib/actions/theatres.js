var async = require('async');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadFilmsInTheatresPage('/es/rdcat.php?id=new_th_es', function (films) {
        dbPool.getConnection(function(err, dbConnection) {
            if (err) {
                console.log(film);
                global.log.error(err);
                throw err;
            }

            dbImport.clearFilmInTheatres(dbConnection, function() {
                dbConnection.destroy();

                let bar = new progressBar(':bar', {total: films.length, clear: true});

                async.forEachLimit(films, 1, function (film, importFilm) {
                    generalAction.addFilm(dbPool, film.id, function() {
                        dbPool.getConnection(function(err, dbConnection) {
                            if (err) {
                                console.log(film);
                                global.log.error(err);
                                throw err;
                            }

                            dbImport.insertFilmInTheatres(dbConnection, film, function() {
                                bar.tick();
                                dbConnection.destroy();

                                setTimeout(() => { importFilm(); }, 1000);
                            });
                        });
                    });

                });
            });
        });
    });
};

module.exports = {
    start : start
};
