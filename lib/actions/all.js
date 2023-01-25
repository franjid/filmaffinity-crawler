var async = require('async');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var dbImport = require(__dirname + '/../dbImport.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function () {
  var dbPool = db.getPool();

  dbPool.getConnection(function (err, dbConnection) {
    if (err) {
      global.log.error(err);
      throw err;
    }

    dbImport.getAllFilmIds(dbConnection, function (idFilms) {
      dbConnection.destroy();

      let bar = new progressBar(':bar', {total: idFilms.length, clear: true}),
        filmsImported = 0;

      async.forEachLimit(idFilms, 2, function (idFilm, importFilm) {
        generalAction.addFilm(dbPool, idFilm, function() {
          console.log("idFilm: " + idFilm);
          bar.tick();
          filmsImported++;
          setTimeout(() => { importFilm(); }, global.parameters.delay_loading_films);

          if (filmsImported === idFilms.length()) {
            console.log('All films imported');
            global.log.info('All films imported');
          }
        });
      });
    });
  });

};

module.exports = {
  start: start
};
