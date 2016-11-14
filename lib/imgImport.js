var mkdirp = require('mkdirp');
var request = require('request');

var fs = require('fs');
var useragent = require('random-useragent');

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

                downloadImg(film.largePosterImg, imgPath + '/' + film.id + '.jpg', function() {
                    global.log.info('Poster ' + film.id + ' imported');
                });
            }
        });
    }
};

var downloadImg = function(url, pathFilename) {
    var sizes = ['msmall', 'mmed', 'large'];

    sizes.forEach(function(size) {
        var urlWithSize = url.replace('large', size);
        var pathFilenameWithSize = pathFilename.replace('.jpg', '-' + size + '.jpg');

        global.log.info('Downloading image: ' + urlWithSize, pathFilenameWithSize);

        request.get(getRequestImageOptions(urlWithSize), function (err, response, body) {
            fs.writeFile(pathFilenameWithSize, body, 'binary', function(err) {
                if(err) {
                    global.log.error(err);
                }
            });
        });
    });
};

var getRequestImageOptions = function(url) {
    return {
        url: url,
        timeout: 10000,
        headers: {
            'User-Agent': useragent.getRandom()
        },
        encoding: 'binary'
    };
};

module.exports = {
    importPoster : importPoster
};
