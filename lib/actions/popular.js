var async = require('async');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadFilmsPage('/es/mostvisited.php', function (films) {
        async.each(films, function(filmId) {
            generalAction.addFilm(dbPool, filmId);
        }, function(err) {
            if (err) {
                throw err;
            }

            console.log('All popular films done');
        });
    });
};

module.exports = {
    start : start
};
