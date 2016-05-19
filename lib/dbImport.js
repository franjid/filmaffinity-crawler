const mysql = require('mysql');

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
        ')';

    console.log('***** Importing film to DB: ' + film.id);

    global.dbConnection.query(queryNewFilm, function (err, result) {
        if (err) throw err;
    });
};

module.exports = {
    importFilm : importFilm
};

