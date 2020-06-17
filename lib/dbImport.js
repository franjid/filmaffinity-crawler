const mysql = require('mysql');
var async = require('async');

var insertAssoc = function(dbConnection, assoc, idFilm, idAssoc, relevancePosition, cb) {
    assoc = assoc.charAt(0).toUpperCase() + assoc.slice(1).toLowerCase();

    const query = 'INSERT INTO assocFilm' + assoc + ' VALUES(' +
            '0, ' +
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
            film.numRatings +
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
            ' numRatings = VALUES(numRatings)'
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

var insertUserRating = function (dbConnection, userId, film, cb) {
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

module.exports = {
    filmExistsInDb: filmExistsInDb,
    importFilm: importFilm,
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
    insertUserRating: insertUserRating,
    getUserFriends: getUserFriends,
};
