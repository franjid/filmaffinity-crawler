const mysql = require('mysql');
var async = require('async');

var insertAssoc = function(dbConnection, assoc, idFilm, idAssoc, relevancePosition, cb) {
    assoc = assoc.charAt(0).toUpperCase() + assoc.slice(1).toLowerCase();

    const query = 'INSERT INTO assocFilm' + assoc + ' VALUES(' +
            idFilm + ', ' +
            idAssoc +', ' +
            relevancePosition +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' idFilm = VALUES(idFilm),' +
            ' id' + assoc + ' = VALUES(id' + assoc + '),' +
            ' relevancePosition = ' + relevancePosition
        ;

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var importAssoc = function (dbConnection, assoc, film, cb) {
    if ((!film[assoc] || !film[assoc].length)) {
        cb();
        return;
    }

    if (film[assoc]) {
        var itemsProcessed = 0;

        film[assoc].forEach(function(assocElement, index, array) {
            const queryInsert = 'INSERT INTO ' + assoc + ' VALUES(' +
                    '0,' +
                    mysql.escape(assocElement) +
                    ')'
                ;

            dbConnection.query(queryInsert, function (err, resultInsert) {
                var relevancePosition = index;

                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        const querySelect = 'SELECT id' + assoc + ' FROM ' + assoc + ' WHERE name = ' + mysql.escape(assocElement);
                        dbConnection.query(querySelect, function (err, resultSelect) {
                            if (err || resultSelect == undefined) {
                                global.log.error(querySelect);
                                global.log.error(resultSelect);
                                throw err;
                            }

                            insertAssoc(dbConnection, assoc, film.id, resultSelect[0]['id' + assoc], relevancePosition, function() {
                                itemsProcessed++;

                                if(itemsProcessed === array.length) {
                                    cb();
                                }
                            });
                        });
                    } else {
                        global.log.error(queryInsert);
                        throw err;
                    }
                } else {
                    insertAssoc(dbConnection, assoc, film.id, resultInsert.insertId, relevancePosition, function() {
                        itemsProcessed++;

                        if(itemsProcessed === array.length) {
                            cb();
                        }
                    });
                }
            });
        });
    }
};

var importFilm = function (dbConnection, film, cb) {
    const queryNewFilm = 'INSERT INTO film VALUES(' +
            film.id + ',' +
            mysql.escape(film.title) + ',' +
            mysql.escape(film.originalTitle) + ',' +
            film.year + ',' +
            film.duration + ',' +
            mysql.escape(film.country) + ',' +
            mysql.escape(film.producer) + ',' +
            'NULL,' +
            mysql.escape(film.synopsis) + ',' +
            mysql.escape(JSON.stringify(film.proReviews)) + ',' +
            film.rating + ',' +
            film.numRatings + ', ' +
            0 + ', ' +
            'UNIX_TIMESTAMP()' +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' title = VALUES(title),' +
            ' originalTitle = VALUES(originalTitle),' +
            ' year = VALUES(year),' +
            ' duration = VALUES(duration),' +
            ' country = VALUES(country),' +
            ' producer = VALUES(producer),' +
            ' awards = VALUES(awards),' +
            ' synopsis = VALUES(synopsis),' +
            ' proReviews = VALUES(proReviews),' +
            ' rating = VALUES(rating),' +
            ' numRatings = VALUES(numRatings),' +
            ' numFrames = VALUES(numFrames),' +
            ' dateUpdated = UNIX_TIMESTAMP()'
        ;

    global.log.info('***** Importing film to DB: ' + film.id);

    dbConnection.query(queryNewFilm, function (err) {
        if (err) {
            global.log.error(queryNewFilm);
            throw err;
        }

        var assoc = ['director', 'actor', 'screenplayer', 'musician', 'cinematographer', 'genre', 'topic'];
        var assocProcessed = 0;

        assoc.forEach(function(assocName) {
            importAssoc(dbConnection, assocName, film, function() {
                assocProcessed++;

                if(assocProcessed == assoc.length) {
                    cb();
                }
            });
        });
    });
};

var importUserFilmReview = function (dbConnection, filmId, review, cb) {
    const query = 'INSERT INTO userReview  VALUES(' +
      review.userId + ',' +
      filmId + ',' +
      mysql.escape(review.username) + ', ' +
      review.rating + ',' +
      mysql.escape(review.title) + ', ' +
      mysql.escape(review.reviewText) + ', ' +
      mysql.escape(review.spoiler) + ', ' +
      review.position + ',' +
      review.datePublished.getTime() / 1000 +
      ')' +
      ' ON DUPLICATE KEY UPDATE' +
      ' username = ' + mysql.escape(review.username) + ', ' +
      ' rating = ' + review.rating + ', ' +
      ' title = ' + mysql.escape(review.title) + ', ' +
      ' review = ' + mysql.escape(review.reviewText) + ', ' +
      ' spoiler = ' + mysql.escape(review.spoiler) + ', ' +
      ' position = ' + review.position
    ;

    global.log.info('***** Inserting into userReview: ' + filmId + '|' + review.userId);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            console.log('ERROR in query: ');
            console.log(query);
            throw err;
        }

        cb();
    });
};

var updateFilmNumFrames = function (dbConnection, filmId, numFrames, cb) {
    const query = 'UPDATE film SET numFrames = ' + numFrames + ' WHERE idFilm = ' + filmId;

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb(result);
    });
};

var filmExistsInDb = function (dbConnection, filmId, cb) {
    const queryFilmExists = 'SELECT idFilm FROM film WHERE idFilm = ' + filmId;

    dbConnection.query(queryFilmExists, function (err, result) {
        if (err) {
            global.log.error(queryFilmExists);
            throw err;
        }

        cb(result.length ? true : false);
    });
};

var insertFailedCrawlFilm = function (dbConnection, filmId, cb) {
    const query = 'INSERT INTO failedCrawlFilm VALUES(' +
            filmId +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' idFilm = VALUES(idFilm)'
        ;

    global.log.info('***** Inserting into failedCrawlFilm: ' + filmId);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var getFailedCrawlFilm = function (dbConnection, cb) {
    const query = 'SELECT idFilm FROM failedCrawlFilm';

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb(result);
    });
};

var deleteFailedCrawlFilm = function (dbConnection, idFilm, cb) {
    const query = 'DELETE FROM failedCrawlFilm WHERE idFilm = ' + idFilm;

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var insertFilmInTheatres = function (dbConnection, film, cb) {
    const query = 'INSERT INTO filmInTheatres VALUES(' +
        film.id + ',' +
        mysql.escape(film.releaseDate) +
        ')'
    ;

    global.log.info('***** Inserting into filmInTheatres: ' + film.id + '|' + film.releaseDate);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var clearFilmInTheatres = function (dbConnection, cb) {
    const query = 'TRUNCATE filmInTheatres';

    global.log.info('***** Truncating filmInTheatres');

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var insertFilmPopular = function (dbConnection, film, cb) {
    const query = 'INSERT INTO filmPopular VALUES(' +
        film.id + ',' +
        mysql.escape(film.position) +
        ')'
    ;

    global.log.info('***** Inserting into filmPopular: ' + film.id + '|' + film.position);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var clearFilmPopular = function (dbConnection, cb) {
    const query = 'TRUNCATE filmPopular';

    global.log.info('***** Truncating filmPopular');

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var getUser = function (dbConnection, userId, cb) {
    const query = 'SELECT * FROM user WHERE idUser = ' + userId;

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb(result);
    });
};

var insertUser = function (dbConnection, user, cb) {
    const query = 'INSERT INTO user (`idUser`, `name`, `dateAdded`) VALUES(' +
      user.id + ',' +
      mysql.escape(user.name) + ', ' +
      'UNIX_TIMESTAMP()' +
      ')' +
      ' ON DUPLICATE KEY UPDATE' +
      ' idUser = VALUES(idUser), ' +
      ' name = ' + mysql.escape(user.name) + ', ' +
      ' dateUpdated = UNIX_TIMESTAMP()'
    ;

    global.log.info('***** Inserting into user: ' + user.id + '|' + user.name);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var insertUserFriendship = function (dbConnection, userIdSource, userIdTarget, cb) {
    const query = 'INSERT INTO userFriendship VALUES(' +
      userIdSource + ',' +
      userIdTarget +
      ')' +
      ' ON DUPLICATE KEY UPDATE' +
      ' idUserSource = VALUES(idUserSource)'
    ;

    global.log.info('***** Inserting into userFriendship: ' + userIdSource + '|' + userIdTarget);

    dbConnection.query(query, function (err) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb();
    });
};

var userRatingExists = function (dbConnection, userId, filmId, rating, cb) {
    const query = 'SELECT idUserRating FROM userRating ' +
      ' WHERE idUser = ' + userId +
      ' AND idFilm = ' + filmId +
      ' AND rating = ' + rating;

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        let ratingExists = false;
        if (result.length) {
            ratingExists = !!result[0].idUserRating;
        }

        cb(ratingExists);
    });
};

var insertUserRating = function (dbConnection, userId, film, cb) {
    if (!film.rating) {
        cb();
        return;
    }

    userRatingExists(dbConnection, userId, film.id, film.rating, function(ratingExists) {
        if (ratingExists) {
            // global.log.info('***** Rating already exists: ' + userId + '|' + film.id + '|' + film.rating);
            cb();
            return;
        }

        /**
         * If we get here, it means either the rating is new (then we insert),
         * or user has updated the rating to some of the films (then we update on duplicate user/film)
         */
        const query = 'INSERT INTO userRating VALUES(0, ' +
          userId + ',' +
          film.id + ',' +
          film.rating + ',' +
          film.ratingDate.getTime() / 1000 + ',' +
          film.position +
          ')' +
          ' ON DUPLICATE KEY UPDATE' +
          ' rating = ' + film.rating + ',' +
          ' dateRated = ' + film.ratingDate.getTime() / 1000  + ',' +
          ' position = ' + film.position
        ;

        global.log.info('***** Inserting into userRating: ' + userId + '|' + film.id);

        dbConnection.query(query, function (err) {
            if (err) {
                global.log.error(query);
                throw err;
            }

            cb();
        });
    });
};

var getLastFriendIdUserRating = function (dbConnection, userId, cb) {
    const query = 'SELECT ur.idUserRating FROM userRating ur ' +
      ' JOIN userFriendship uf ON uf.idUserTarget = ur.idUser' +
      ' WHERE uf.idUserSource = ' + userId +
      ' ORDER BY idUserRating DESC' +
      ' LIMIT 1';

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        let idUserRating = null;
        if (result.length) {
            idUserRating = result[0].idUserRating;
        }

        cb(idUserRating);
    });
};

var setUserLastRatingNotification = function (dbConnection, userId, cb) {
    getLastFriendIdUserRating(dbConnection, userId, function(idUserRating) {
        if (!idUserRating) {
            cb();
            return;
        }

        const query = 'INSERT INTO userLastRatingNotificated VALUES(' +
          userId + ',' +
          idUserRating +
          ')' +
          ' ON DUPLICATE KEY UPDATE' +
          ' idUserRating = ' + idUserRating
        ;

        global.log.info('***** Inserting into userLastRatingNotification: ' + userId + '|' + idUserRating);

        dbConnection.query(query, function (err) {
            if (err) {
                global.log.error(query);
                throw err;
            }

            cb();
        });
    });
};

var getUserFriends = function (dbConnection, cb) {
    const query = 'SELECT idUserTarget AS idUser FROM userFriendship GROUP BY idUserTarget';

    dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        cb(result);
    });
};

var getUserFriendsFilms = function (dbConnection, cb) {
    const query = 'SELECT idFilm FROM userRating ' +
      'WHERE dateRated > UNIX_TIMESTAMP() - 259200 GROUP BY idFilm';// (last 3 days)

    dbConnection.query(query, function (err, results) {
        if (err) {
            global.log.error(query);
            throw err;
        }

        if (!results.length) {
            cb([]);
            return;
        }

        cb(results.map(result => result.idFilm));
    });
};

module.exports = {
    filmExistsInDb: filmExistsInDb,
    importFilm: importFilm,
    importUserFilmReview: importUserFilmReview,
    updateFilmNumFrames: updateFilmNumFrames,
    insertFailedCrawlFilm: insertFailedCrawlFilm,
    getFailedCrawlFilm: getFailedCrawlFilm,
    deleteFailedCrawlFilm: deleteFailedCrawlFilm,
    clearFilmInTheatres: clearFilmInTheatres,
    insertFilmInTheatres: insertFilmInTheatres,
    clearFilmPopular: clearFilmPopular,
    insertFilmPopular: insertFilmPopular,
    getUser: getUser,
    insertUser: insertUser,
    insertUserFriendship: insertUserFriendship,
    userRatingExists: userRatingExists,
    insertUserRating: insertUserRating,
    getLastFriendIdUserRating: getLastFriendIdUserRating,
    setUserLastRatingNotification: setUserLastRatingNotification,
    getUserFriends: getUserFriends,
    getUserFriendsFilms: getUserFriendsFilms,
};
