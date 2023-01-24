var mkdirp = require('mkdirp');
var request = require('request');

var fs = require('graceful-fs');
var userAgents = require('user-agents');

var importPoster = function (film, cb) {
  if (film.largePosterImg) {
    var imgDirPathArray = film.id.toString().match(/.{1,2}/g);
    var imgDirPath = global.parameters.img_dir + imgDirPathArray.join('/') + '/';

    mkdirp(imgDirPath, function (err) {
      if (err) {
        throw err;
      }

      downloadImg(film.largePosterImg, imgDirPath + film.id + '.jpg', cb);
    });
  } else {
    cb();
  }
};

var importFilmFrames = function (film, filmFrames, cb) {
    let imgDirPathArray = film.id.toString().match(/.{1,2}/g),
      imgDirPath = global.parameters.img_dir + imgDirPathArray.join('/') + '/frames/';

    mkdirp(imgDirPath, function (err) {
      if (err) {
        throw err;
      }

      filmFrames.forEach(frame => {
        let filePathThumb = imgDirPath + frame.position +'_thumb.jpg',
          filePathLarge = imgDirPath + frame.position +'.jpg';

        global.log.info('Downloading image: ' + frame.thumb);
        request.get(getRequestImageOptions(frame.thumb), function (err, response, body) {
          fs.writeFile(filePathThumb, body, 'binary', function (err) {
            if (err) {
              global.log.error(err);
            }
          });
        });

        global.log.info('Downloading image: ' + frame.large);
        request.get(getRequestImageOptions(frame.large), function (err, response, body) {
          fs.writeFile(filePathLarge, body, 'binary', function (err) {
            if (err) {
              global.log.error(err);
            }
          });
        });
      });

      cb();
    });
};

var downloadImg = function (url, pathFilename, cb) {
  var sizes = ['msmall', 'mmed', 'large'];

  sizes.forEach(function (size) {
    var urlWithSize = url.replace('large', size);
    var pathFilenameWithSize = pathFilename.replace('.jpg', '-' + size + '.jpg');
    // var completePathFilenameWithSize = process.cwd() + '/' + pathFilenameWithSize;

    // if (!fs.existsSync(completePathFilenameWithSize)) {
    global.log.info('Downloading image: ' + urlWithSize, pathFilenameWithSize);

    request.get(getRequestImageOptions(urlWithSize), function (err, response, body) {
      fs.writeFile(pathFilenameWithSize, body, 'binary', function (err) {
        if (err) {
          global.log.error(err);
        }
      });
    });
    // }
  });

  cb();
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
