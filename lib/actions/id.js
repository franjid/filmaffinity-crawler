var crawler = require(__dirname + '/../crawler.js');
var db = require(__dirname + '/../db.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function (filmId) {
  /**
   * In case we want to test adding the film to DB
   */
  // var dbPool = db.getPool();
  // generalAction.addFilm(dbPool, filmId);
  // return;

  crawler.loadFilm(filmId, function (errorLoadingFilm, film) {
    if (errorLoadingFilm) {
      console.log('Error loading film');
    } else {
      console.log(film);
    }
  });
};

module.exports = {
  start: start
};
