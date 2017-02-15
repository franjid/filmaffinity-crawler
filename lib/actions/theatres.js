var async = require('async');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadFilmsPage('/es/cat_new_th_es.html', function (films) {
        async.each(films, function(filmId) {
            //generalAction.addFilm(dbPool, filmId);
            console.log('@todo Process film in theatres')
        }, function(err) {
            if (err) {
                throw err;
            }

            console.log('All films in theatres done');
        });
    });
};

module.exports = {
    start : start
};
