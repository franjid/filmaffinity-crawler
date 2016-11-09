const mysql = require('mysql');
var async = require('async');

var insertAssoc = function(assoc, idFilm, idAssoc) {
    const query = 'INSERT INTO assocFilm' + assoc + ' VALUES(' +
            '0,' +
            idFilm + ',' +
            idAssoc +
            ')' +
            ' ON DUPLICATE KEY UPDATE' +
            ' idFilm = VALUES(idFilm),' +
            ' id' + assoc + ' = VALUES(id' + assoc + ')'
        ;

    global.dbConnection.query(query, function (err, result) {
        if (err) {
            global.log.error(query);
            throw err;
        }
    });
};

var importAssoc = function (assoc, film) {
    if (film[assoc]) {
        async.forEach(film[assoc], function(assocElement) {
            const queryInsert = 'INSERT INTO ' + assoc + ' VALUES(' +
                    '0,' +
                    mysql.escape(assocElement) +
                    ')'
                ;

            global.dbConnection.query(queryInsert, function (err, resultInsert) {
                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        const querySelect = 'SELECT id' + assoc + ' FROM ' + assoc + ' WHERE name = ' + mysql.escape(assocElement);
                        global.dbConnection.query(querySelect, function (err, resultSelect) {
                            insertAssoc(assoc, film.id, resultSelect[0]['id' + assoc]);
                        });
                    } else {
                        global.log.error(queryInsert);
                        throw err;
                    }
                } else {
                    insertAssoc(assoc, film.id, resultInsert.insertId);
                }
            });
        });
    }
};

var importFilm = function (film) {
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
            ' officialReviews = VALUES(officialReviews),' +
            ' rating = VALUES(rating),' +
            ' numRatings = VALUES(numRatings)'
        ;

    global.log.info('***** Importing film to DB: ' + film.id);

    global.dbConnection.query(queryNewFilm, function (err) {
        if (err) {
            global.log.error(queryNewFilm);
            throw err;
        }

        importAssoc('director', film);
        importAssoc('actor', film);
        importAssoc('screenplayer', film);
        importAssoc('musician', film);
        importAssoc('cinematographer', film);
        importAssoc('genre', film);
        importAssoc('topic', film);
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
    importFilm : importFilm,
    insertFailedCrawlFilm: insertFailedCrawlFilm
};
