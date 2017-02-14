const mysql = require('mysql');
var async = require('async');

var insertAssoc = function(dbConnection, assoc, idFilm, idAssoc, cb) {
    assoc = assoc.charAt(0).toUpperCase() + assoc.slice(1).toLowerCase();

    const query = 'INSERT INTO assocFilm' + assoc + ' VALUES(' +
            '0,' +
            idFilm + ',' +
            idAssoc +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' idFilm = VALUES(idFilm),' +
            ' id' + assoc + ' = VALUES(id' + assoc + ')'
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
        film[assoc].forEach(function(assocElement, index, array) {
            const queryInsert = 'INSERT INTO ' + assoc + ' VALUES(' +
                    '0,' +
                    mysql.escape(assocElement) +
                    ')'
                ;

            dbConnection.query(queryInsert, function (err, resultInsert) {
                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        const querySelect = 'SELECT id' + assoc + ' FROM ' + assoc + ' WHERE name = ' + mysql.escape(assocElement);
                        dbConnection.query(querySelect, function (err, resultSelect) {
                            if (err || resultSelect == undefined) {
                                global.log.error(querySelect);
                                global.log.error(resultSelect);
                                throw err;
                            }
                            insertAssoc(dbConnection, assoc, film.id, resultSelect[0]['id' + assoc], function() {
                                if (index === array.length - 1){
                                    cb();
                                }
                            });
                        });
                    } else {
                        global.log.error(queryInsert);
                        throw err;
                    }
                } else {
                    insertAssoc(dbConnection, assoc, film.id, resultInsert.insertId, function() {
                        if (index === array.length - 1){
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
            'NULL,' +
            film.rating + ',' +
            film.numRatings + ',' +
            '0' +
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
            ' officialReviews = VALUES(officialReviews),' +
            ' rating = VALUES(rating),' +
            ' numRatings = VALUES(numRatings),' +
            ' inTheatres = VALUES(inTheatres)'
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

var insertFailedCrawlFilm = function (filmId) {
    const query = 'INSERT INTO failedCrawlFilm VALUES(' +
            filmId +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' idFilm = VALUES(idFilm)'
        ;

    global.log.info('***** Inserting into failedCrawlFilm: ' + filmId);

    global.dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }
    });
};

module.exports = {
    filmExistsInDb: filmExistsInDb,
    importFilm : importFilm,
    insertFailedCrawlFilm: insertFailedCrawlFilm
};
