var crawler = require(__dirname + '/../crawler.js');
var db = require(__dirname + '/../db.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function (userIds, cb) {
  var dbPool = db.getPool();
  userIds = [303397, 5926608, 306683];

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

  var userIdsImported = 0;

  userIds.forEach((userId, i, userIdsArray) => {
    var ratingsImported = 0;

    global.log.info('Loading ratings from user: ' + userId);

    crawler.loadUserLastFilmsRated(userId, function (filmsRatingInfo) {
      global.log.info('Importing ratings from user: ' + userId);

      if (!filmsRatingInfo.length) {
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
              userIdsImported++;
              dbConnection.destroy();
            }

            if(userIdsImported === userIdsArray.length) {
              console.log('All user ratings imported');
              global.log.info('All  user ratings imported');

              console.log('Callback');
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
