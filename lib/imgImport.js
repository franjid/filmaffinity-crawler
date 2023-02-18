var mkdirp = require('mkdirp');
var request = require('request');

var fs = require('graceful-fs');
var userAgents = require('user-agents');
const async = require("async");

var importPoster = function (film, cb) {
  if (film.largePosterImg) {
    var imgDirPathArray = film.id.toString().match(/.{1,2}/g);
    var imgDirPath = __dirname + '/../' + global.parameters.img_dir + imgDirPathArray.join('/') + '/';

    mkdirp(imgDirPath, function (err) {
      if (err) {
        throw err;
      }

      downloadPoster(film.largePosterImg, imgDirPath + film.id + '.jpg', cb);
    });
  } else {
    cb();
  }
};

var downloadPoster = function (url, pathFilename, cb) {
  var sizes = ['msmall', 'mmed', 'large'];

  async.forEachLimit(sizes, 1, function (size, downloadNextSize) {
    var urlWithSize = url.replace('large', size);
    var pathFilenameWithSize = pathFilename.replace('.jpg', '-' + size + '.jpg');

    global.log.info('Downloading image: ' + urlWithSize, pathFilenameWithSize);

    request.get(getRequestImageOptions(urlWithSize), function (err, response, body) {
      fs.writeFile(pathFilenameWithSize, body, 'binary', function (err) {
        if (err) {
          global.log.error(err);
        }
        downloadNextSize();
      });
    });
  }, function(err) {
    if (err) {
      throw err;
    }

    cb();
  });
};

var importFilmFrames = function (film, filmFrames, cb) {
  let imgDirPathArray = film.id.toString().match(/.{1,2}/g),
    imgDirPath = __dirname + '/../' + global.parameters.img_dir + imgDirPathArray.join('/') + '/frames/';

  mkdirp(imgDirPath, function (err) {
    if (err) {
      throw err;
    }

    downloadFrames(filmFrames, imgDirPath, cb);
  });
};

var downloadFrames = function (filmFrames, imgDirPath, cb) {
  async.forEachLimit(filmFrames, 1, function (frame, downloadNextFrame) {
    let filePathThumb = imgDirPath + frame.position +'_thumb.jpg',
      filePathLarge = imgDirPath + frame.position +'.jpg';

    global.log.info('Downloading image: ' + frame.thumb);
    request.get(getRequestImageOptions(frame.thumb), function (err, response, body) {
      fs.writeFile(filePathThumb, body, 'binary', function (err) {
        if (err) {
          global.log.error(err);
        }

        global.log.info('Downloading image: ' + frame.large);
        request.get(getRequestImageOptions(frame.large), function (err, response, body) {
          fs.writeFile(filePathLarge, body, 'binary', function (err) {
            if (err) {
              global.log.error(err);
            }

            downloadNextFrame();
          });
        });
      });
    });
  }, function(err) {
    if (err) {
      throw err;
    }

    cb();
  });
};

var getRequestImageOptions = function (url) {
  const userAgent = (new userAgents({deviceCategory: 'desktop'})).data.userAgent;

  return {
    url: url,
    timeout: 10000,
    headers: {
      'User-Agent': userAgent
    },
    encoding: 'binary'
  };
};

module.exports = {
  importPoster: importPoster,
  importFilmFrames: importFilmFrames
};
