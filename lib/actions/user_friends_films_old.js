var db = require(__dirname + '/../db.js');
var dbImport = require(__dirname + '/../dbImport.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function (cb) {
  var dbPool = db.getPool();

  dbPool.getConnection(function (err, dbConnection) {
    if (err) {
      global.log.error(err);
      throw err;
    }

    dbImport.getUserFriendsFilms(dbConnection, function (idFilms) {
      dbConnection.destroy();

      idFilms.forEach(idFilm => {
        generalAction.addFilm(dbPool, idFilm, cb);
      });
    });
  });

};

module.exports = {
  start: start
};
