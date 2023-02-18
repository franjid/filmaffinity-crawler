var crawler = require(__dirname + '/../crawler.js');
var dbImport = require(__dirname + '/../dbImport.js');
var imgImport = require(__dirname + '/../imgImport.js');

var addFilm = function(dbPool, filmId, cb = function() {}) {
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
                    cb();
                });
            } else if (!isNaN(film.year)) { // Confirm that film has basic data
                // dbImport.filmExistsInDb(dbConnection, film.id, function(filmExists) {
                    dbImport.importFilm(dbConnection, film, function() {
                      imgImport.importPoster(film, function() {
                        crawler.loadFilmFrames(filmId, function (filmFrames) {
                          var loadUserReviews = () => {
                            crawler.loadFilmUserReviews(filmId, function (filmReviews) {
                              if (!filmReviews.length) {
                                dbConnection.destroy();
                                cb();
                              }

                              let reviewsImported = 0;

                              filmReviews.forEach(review => {
                                dbImport.importUserFilmReview(dbConnection, filmId, review, function () {
                                  reviewsImported++;

                                  if (reviewsImported === filmReviews.length) {
                                    dbConnection.destroy();
                                    cb();
                                  }
                                })
                              });
                            });
                          }

                          if (filmFrames.length) {
                            imgImport.importFilmFrames(film, filmFrames, function() {
                              dbPool.getConnection(function(err, dbConnectionFrames) {
                                dbImport.updateFilmNumFrames(dbConnectionFrames, filmId, filmFrames.length, function() {
                                  dbConnectionFrames.destroy();
                                  loadUserReviews();
                                })
                              });
                            });
                          } else {
                            loadUserReviews();
                          }
                        });
                      });
                    });
                // });
            } else {
                dbConnection.destroy();
                cb();
            }
        });
    });
};

module.exports = {
    addFilm : addFilm
};
