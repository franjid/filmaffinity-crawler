var mkdirp = require('mkdirp');
var request = require('request');

var fs = require('graceful-fs');
var userAgents = require('user-agents');

var importPoster = function (film) {
  if (film.largePosterImg) {
    var imgDirPathArray = film.id.toString().match(/.{1,2}/g);
    var imgDirPath = global.parameters.img_dir + imgDirPathArray.join('/') + '/';

    mkdirp(imgDirPath, function (err) {
      if (err) {
        throw err;
      }

      downloadImg(film.largePosterImg, imgDirPath + film.id + '.jpg');
    });
  }
};

var downloadImg = function (url, pathFilename) {
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
  importPoster: importPoster
};
