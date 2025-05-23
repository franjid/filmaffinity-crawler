var async = require('async');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');
var dbImport = require(__dirname + '/../dbImport.js');
var utils = require(__dirname + '/../utils.js');

var start = function(platform) {
    var dbPool = db.getPool();
    var platform_argument = null;

    switch (platform) {
        case 'amazon':
            platform_argument = 'new_amazon_es'
            break;
        case 'apple':
            platform_argument = 'apple_tv_plus'
            break;
        case 'disney':
            platform_argument = 'disneyplus'
            break;
        case 'filmin':
            platform_argument = 'new_filmin'
            break;
        case 'hbo':
            platform_argument = 'new_hbo_es'
            break;
        case 'movistar':
            platform_argument = 'new_movistar_f'
            break;
        case 'netflix':
            platform_argument = 'new_netflix'
            break;
        default:
            console.log('No valid platform');
            global.log.error('No valid platform');
            process.exit();
    }

    crawler.loadNewFilmsInPlatform('/es/rdcat.php?id=' + platform_argument, function (films) {
        dbPool.getConnection(function(err, dbConnection) {
            if (err) {
                console.log(films);
                global.log.error(err);
                throw err;
            }

            dbImport.clearNewFilmsInPlatform(platform, dbConnection, function() {
                dbConnection.destroy();

                let bar = new progressBar(':bar', {total: films.length, clear: true});

                async.forEachLimit(films, 1, function (film, importFilm) {
                    generalAction.addFilm(dbPool, film.id, function() {
                        dbPool.getConnection(function(err, dbConnection) {
                            if (err) {
                                console.log(film);
                                global.log.error(err);
                                throw err;
                            }

                            dbImport.insertNewFilmsInPlatform(platform, dbConnection, film, function() {
                                film.platform = [utils.getIdByTypeAndPlatform('subscription', platform)];

                                dbImport.importPlatformAssoc(dbConnection, 'platform', film, function() {
                                    bar.tick();
                                    dbConnection.destroy();

                                    setTimeout(() => { importFilm(); }, global.parameters.delay_loading_films);
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
    start : start
};
