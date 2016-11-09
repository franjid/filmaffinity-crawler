var mkdirp = require('mkdirp');
var crawler = require(__dirname + '/crawler.js');

var importPoster = function (film) {
    if (film.largePosterImg) {
        var imgPathArray = film.id.toString().match(/.{1,2}/g);
        var imgPath = global.parameters.img_dir + imgPathArray.join('/') + '/';

        mkdirp(imgPath, function (err) {
            if (err) {
                throw err;
            }
            else {
                global.log.info('Importing poster: ' + film.largePosterImg);

                crawler.downloadImg(film.largePosterImg, imgPath + '/' + film.id + '.jpg', function() {
                    global.log.info('Poster ' + film.id + ' imported');
                });
            }
        });
    }
};

module.exports = {
    importPoster : importPoster
};
