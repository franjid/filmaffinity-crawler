var async = require('async');
var progressBar = require('progress');
var crawler = require(__dirname + '/../crawler.js');
var db = require(__dirname + '/../db.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function (userIds, cb) {
  var dbPool = db.getPool();

  if (!userIds || !userIds.length) {
    dbPool.getConnection(function (err, dbConnection) {
      if (err) {
        global.log.error(err);
        throw err;
      }

      dbImport.getUserFriends(dbConnection, function (results) {
        dbConnection.destroy();

        var userIds = [];

        results.forEach(result => {
          userIds.push(result.idUser);
        });

        importUsersRatings(userIds, cb);
      });
  });
  } else {
    importUsersRatings(userIds, cb);
  }
};

var importUsersRatings = function(userIds, cb) {
  var dbPool = db.getPool();
  var bar = new progressBar(':bar', {total: userIds.length, clear: true});
  var userIdsImported = 0;

  async.forEachLimit(userIds, 5, function (userId, loadUserRatings) {
    var ratingsImported = 0;

    global.log.info('Loading ratings from user: ' + userId);

    crawler.loadUserLastFilmsRated(userId, function (filmsRatingInfo) {
      global.log.info('Importing ratings from user: ' + userId);

      if (!filmsRatingInfo.length) {
        bar.tick();
        userIdsImported++;
        loadUserRatings();
        return;
      }

      dbPool.getConnection(function (err, dbConnection) {
        if (err) {
          global.log.error(err);
          throw err;
        }

        filmsRatingInfo.forEach((film, j, filmsRatingInfoArray) => {
          dbImport.insertUserRating(dbConnection, userId, film, function() {
            ratingsImported++;

            if(ratingsImported === filmsRatingInfoArray.length) {
              bar.tick();
              userIdsImported++;
              dbConnection.destroy();

              setTimeout(() => { loadUserRatings(); }, 500);
            }

            if(userIdsImported === userIds.length) {
              console.log('All user ratings imported');
              global.log.info('All user ratings imported');

              if (cb) {
                cb();
              }
            }
          });
        });
      });
    });
  });
}

module.exports = {
  start: start
};
