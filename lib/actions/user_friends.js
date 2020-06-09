var crawler = require(__dirname + '/../crawler.js');
var db = require(__dirname + '/../db.js');
var dbImport = require(__dirname + '/../dbImport.js');

var start = function (userId, cb) {
  var dbPool = db.getPool();
  var friendIds = [];

  dbPool.getConnection(function (err, dbConnection) {
    if (err) {
      global.log.error(err);
      throw err;
    }

    dbImport.getUser(dbConnection, userId, function (user) {
      dbConnection.destroy();

      if (!user) {
        return;
      }

      var userCookie = user[0].cookieFilmaffinity;

      crawler.getUserFriendsGroups(userCookie, function (friendsGroups) {
        if (!friendsGroups.length) {
          return;
        }

        var groupFriendsImported = 0;

        friendsGroups.forEach((groupId, i, friendsGroupsArray) => {
          global.log.info('Reading friends from group: ' + groupId);

          crawler.getUserFriends(userCookie, groupId, function (userFriends) {
            var friendsImported = 0;

            userFriends.forEach((friend, j, userFriendsArray) => {
              dbPool.getConnection(function(err, dbConnection) {
                if (err) {
                  console.log(friend);
                  global.log.error(err);
                  throw err;
                }

                dbImport.insertUser(dbConnection, friend, function() {
                  dbImport.insertUserFriendship(dbConnection, userId, friend.id, function() {
                    friendIds.push(friend.id);
                    friendsImported++;
                    dbConnection.destroy();

                    if(friendsImported === userFriendsArray.length) {
                      groupFriendsImported++;
                    }

                    if(groupFriendsImported === friendsGroupsArray.length) {
                      console.log('All friends imported');
                      console.log(friendIds);
                      global.log.info('All friends imported');
                      global.log.info(friendIds);

                      if (cb) {
                        cb(friendIds);
                      }
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  start: start
};
