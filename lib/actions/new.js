var async = require('async');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function() {
    var dbPool = db.getPool();

    crawler.loadFilmsPage('/es/tour.php?idtour=24&vm=1', function (films) {
        async.each(films, function(filmId) {
            generalAction.addFilm(dbPool, filmId);
        }, function(err) {
            if (err) {
                throw err;
            }

            console.log('All new films done');
        });
    });
};

module.exports = {
    start : start
};
