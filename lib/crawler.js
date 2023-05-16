var request = require('request');
var userAgents = require('user-agents');
var cheerio = require('cheerio');
var exec = require('child_process').exec;
var utils = require(__dirname + '/utils.js');

let validProxy = false;

var getRequestOptions = function (url, desktop) {
  /**
   * We need to set a desktop user agent, if we get a random one and we set it to mobile,
   * Filmaffinity response could be different and all dom logic would be broken
   */
  const userAgent = (new userAgents({deviceCategory: desktop ? 'desktop' : 'mobile'})).data.userAgent;

  return {
    url: url,
    proxy: global.parameters.proxy_enabled ? global.parameters.proxy : null,
    timeout: 5000,
    headers: {
      'User-Agent': userAgent
    }
  };
};

var getProxyRequestOptions = function (url, desktop, callback) {
  let requestOptions = getRequestOptions(url, desktop);

  if (!global.parameters.proxy_enabled) {
    callback(requestOptions);
    return;
  }

  if (validProxy) {
    requestOptions.proxy = validProxy;
    global.log.info('Returning previously valid proxy');
    callback(requestOptions);
    return;
  }

  // if (Math.random() >= 0.5) {
  if (false) {
    global.log.info('Using Tor');
    callback(getRequestOptions(url, desktop));
    return;
  }

  global.log.info('Requesting rotating proxy');

  const requestOption = {
    url: 'https://gimmeproxy.com/api/getProxy?api_key=' + global.parameters.proxy_api_key + '&supportsHttps=true&anonymityLevel=1&maxCheckPeriod=600',
    timeout: 2000,
  };

  request.get(requestOption, function (error, response, body) {
    if (error || response.statusCode != 200) {
      global.log.error('Error getting proxy');
      // global.log.error('Requesting proxy again');
      getProxyRequestOptions(url, desktop, callback);
    } else {
      let response = JSON.parse(body);

      validProxy = response.protocol + '://' + response.ip + ':' + response.port;
      requestOptions.proxy = validProxy;

      global.log.info('Returning proxy');
      callback(requestOptions);
    }
  });
}

var handleFailedRequest = function (requestFuncName, error, response, cb) {
  global.log.error('Some error happened with request in ' + requestFuncName);
  global.log.error(error);

  if (response && response.statusCode) {
    global.log.error(response.statusCode + "\n");
  }

  global.log.info('Invalidating former valid proxy...');
  validProxy = false;

  if (cb) {
    setTimeout(() => { cb(); }, 1000);
  }

  // try {
  //   global.log.info('Refreshing Tor IP...');
  //
  //   var command = 'echo \'AUTHENTICATE ""\\nsignal NEWNYM\\nQUIT\' | nc localhost 9051';
  //   exec(command, function (error, out) {
  //     if (error) {
  //       global.log.error('Error on exec: ' + command);
  //       global.log.error(error);
  //       global.log.error(out);
  //     }
  //
  //     if (cb) {
  //       setTimeout(() => { cb(); }, 1000);
  //     }
  //   });
  // } catch (e) {
  //   global.log.error("Catched exec error: " + e);
  //   setTimeout(() => { cb(); }, 1000);
  // }
};

var getNumPagesOfFilmsStartingWithChar = function (char, callback) {
  var url = global.parameters.filmaffinity_host + '/es/allfilms_' + char + '_1.html';

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest(
          'getNumPagesOfFilmsStartingWithChar',
          error,
          response,
          getNumPagesOfFilmsStartingWithChar(char, callback)
        );
      } else {
        var $ = cheerio.load(body);
        var numPages = $($(body).find('table tr td b')[30]).text();

        $ = null;

        callback(char, numPages);
      }
    });
  });
};

var loadFilmsPage = function (endpoint, callback) {
  var url = global.parameters.filmaffinity_host + endpoint;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadFilmsPage', error, response, loadFilmsPage(endpoint, callback)
        );
      } else {
        var $ = cheerio.load(body),
          filmsDom = $(body).find('.mc-poster a'),
          films = [];

        filmsDom.each(function () {
          films.push($(this).attr('href').match('/es/film(.*).html')[1]);
        });

        $ = null;
        filmsDom = null;

        if (!films.length) {
          handleFailedRequest('loadFilmsPage', error, response, loadFilmsPage(endpoint, callback));
        }

        callback(films);
      }
    });
  });
};

var loadTopFilmsPage = function (page, callback) {
  var url = global.parameters.filmaffinity_host + '/es/topgen.php';
  var offset = page * 30;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    requestOptions.form = {
      from: offset
    };

    request.post(requestOptions, function (error, response, body) {
      if (body && body.includes('no-movies')) {
        callback(false);
        return;
      }

      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadTopFilmsPage', error, response, loadTopFilmsPage(page, callback));
      } else {
        var $ = cheerio.load(body),
          filmsDom = $(body).find('.mc-poster a'),
          films = [];

        filmsDom.each(function () {
          films.push($(this).attr('href').match('/es/film(.*).html')[1]);
        });

        $ = null;
        filmsDom = null;

        if (!films.length) {
          handleFailedRequest('loadTopFilmsPage', error, response, loadTopFilmsPage(page, callback));
        }

        callback(films);
      }
    });
  });
};

var loadPopularFilmsPage = function (endpoint, callback) {
  var url = global.parameters.filmaffinity_host + endpoint;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadPopularFilmsPage', error, response, loadPopularFilmsPage(endpoint, callback));
      } else {
        var $ = cheerio.load(body),
          filmsDom = $(body).find('.top-movie'),
          films = [];

        filmsDom.each(function () {
          var film = {
            id: $(this).find('.movie-card').attr('data-movie-id'),
            position: $(this).find('.position').text().trim()
          };

          films.push(film);
        });

        $ = null;
        filmsDom = null;

        if (!films.length) {
          handleFailedRequest('loadFilmsPage', error, response, loadFilmsPage(endpoint, callback));
        }

        callback(films);
      }
    });
  });
};

var loadFilmsInTheatresPage = function (endpoint, callback) {
  var url = global.parameters.filmaffinity_host + endpoint;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadFilmsInTheatresPage', error, response, loadFilmsInTheatresPage(endpoint, callback));
      } else {
        var $ = cheerio.load(body);
        var filmsDom = $(body).find('#main-wrapper-rdcat');
        var films = [];

        filmsDom.each(function () {
          var dateNumbers = $(this).find('.rdate-cat').attr('id').split('-'),
            year = dateNumbers[0],
            month = dateNumbers[1],
            day = dateNumbers[2],
            releaseDate = year + '-' + month + '-' + day;

          $(this).find('.mc-poster a').each(function () {
            var filmId = $(this).attr('href').match('/es/film(.*).html')[1];
            films.push({id: filmId, releaseDate: releaseDate});
          });
        });

        $ = null;
        filmsDom = null;

        if (!films.length) {
          global.log.error(body);
          throw 'Film id\'s is empty';
        }
        callback(films);
      }
    });
  });
};

var loadNewFilmsInPlatform = function (endpoint, callback) {
  var url = global.parameters.filmaffinity_host + endpoint;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadNewFilmsInPlatform', error, response, loadNewFilmsInPlatform(endpoint, callback));
      } else {
        var $ = cheerio.load(body);
        var filmsDom = $(body).find('#main-wrapper-rdcat');
        var films = [];

        filmsDom.each(function () {
          var dateNumbers = $(this).find('.rdate-cat').attr('id').split('-'),
            year = dateNumbers[0],
            month = dateNumbers[1],
            day = dateNumbers[2],
            releaseDate = year + '-' + month + '-' + day;

          $(this).find('.mc-poster a').each(function () {
            var filmId = $(this).attr('href').match('/es/film(.*).html')[1];
            films.push({id: filmId, releaseDate: releaseDate});
          });
        });

        $ = null;
        filmsDom = null;

        if (!films.length) {
          global.log.error(body);
          throw 'Film id\'s is empty';
        }
        callback(films.slice(0, 30));
      }
    });
  });
};


var loadUserLastFilmsRated = function (userId, callback) {
  var url = global.parameters.filmaffinity_host + '/es/userratings.php?user_id=' + userId;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('loadUserLastFilmsRated', error, response, loadUserLastFilmsRated(userId, callback));
      } else {
        var $ = cheerio.load(body),
          filmsDom = $(body).find('.user-ratings-wrapper'),
          films = [];

        filmsDom.each(function () {
          var rawRatingDate = $(this).find('.user-ratings-header').text().split(' '),
            year = rawRatingDate[7],
            month = mapSpanishMonth(rawRatingDate[5]),
            day = rawRatingDate[3].padStart(2, '0'),
            dateFormatted = year + '-' + month + '-' + day + 'T00:00:00.000Z',
            ratingDate = new Date(dateFormatted);

          var filmsSameDateDom = $(this).find('.user-ratings-movie');
          var position = 0;

          filmsSameDateDom.each(function () {
            var film = {
              id: $(this).find('.movie-card').attr('data-movie-id'),
              rating: $(this).find('.ur-mr-rat').text().trim(),
              ratingDate: ratingDate,
              position: position
            };

            films.push(film);
            position++;
          });
        });

        $ = null;
        filmsDom = null;

        callback(films);
      }
    });
  });
};

var mapSpanishMonth = function (spanishMonth) {
  var months = {
    'enero': '01',
    'febrero': '02',
    'marzo': '03',
    'abril': '04',
    'mayo': '05',
    'junio': '06',
    'julio': '07',
    'agosto': '08',
    'septiembre': '09',
    'octubre': '10',
    'noviembre': '11',
    'diciembre': '12',
  };

  return months[spanishMonth.toLowerCase()];
}

var captchaTriggered = function (body) {
  var $ = cheerio.load(body);

  return !!$(body).find('.alert').text().length;
};

var processFilmFieldValue = function (film, field, value) {
  switch (field) {
    case "Título original":
      film.originalTitle = value.trim();
      break;
    case "Año":
      film.year = parseInt(value.trim(), 10);
      break;
    case "Duración":
      film.duration = value.trim().match('(.*) min.')[1] * 60;
      break;
    case "Dirección":
      film.director = processParticipants(replaceParenthesis(value.trim()));
      break;
    case "Guion":
      film.screenplayer = processParticipants(replaceParenthesis(value.trim()));
      break;
    case "Música":
      film.musician = processParticipants(replaceParenthesis(value.trim()));
      break;
    case "Fotografía":
      film.cinematographer = processParticipants(replaceParenthesis(value.trim()));
      break;
    case "Reparto":
      // Deprecated. We shouldn't use this anymore
      // film.actor = processParticipants(replaceParenthesis(value.trim()));
      break;
    case "Productora":
      film.producer = value.trim();
      break;
    case "Género":
      film.genre = processGenre(value.trim());
      film.topic = processTopic(value.trim());
      break;
    case "Sinopsis":
      film.synopsis = value.replace('(FILMAFFINITY)', '').trim();
      break;
    case "Premios":
      film.awards = value.trim().split('\n        \r\n');
      break;
  }

  return film;
};

var replaceParenthesis = function (string) {
  return string.replace(/\s*\(.*?\)\s*/g, '');
};

var processCountry = function (countryFlagUrl) {
  return typeof countryFlagUrl !== 'undefined' && countryFlagUrl !== null
    ? countryFlagUrl.match('/imgs/countries2/(.*).png')[1].toLowerCase()
    : 'zz';
};

var processParticipants = function (peopleString) {
  return peopleString.split(/,\s*/);
};

var processGenre = function (genreTopic) {
  return (genreTopic.split(' |')[0]).split(/\.\s*/);
};

var processTopic = function (genreTopic) {
  var genreTopicSplit = genreTopic.split(' |');

  return genreTopicSplit[1] ? genreTopicSplit[1].trim().split(/\.\s*/) : [];
};

var processProReviews = function (htmlDom) {
  var review = [];

  htmlDom('#pro-reviews .pro-review').each(function () {
    let reviewBody = htmlDom(this).find('[itemprop=reviewBody]').text().trim(),
      reviewAuthor = htmlDom(this).find('[itemprop=author]').text().trim(),
      trendRaw = htmlDom(this).find('[itemprop=author] i').attr('class'),
      trend;

    if (trendRaw.includes('pos')) {
      trend = 'positive';
    } else if (trendRaw.includes('neu')) {
      trend = 'neutral';
    } else if (trendRaw.includes('neg')) {
      trend = 'negative';
    } else if (trendRaw.includes('default')) {
      trend = 'default';
    }

    review.push({'review': reviewBody, 'author': reviewAuthor, 'trend': trend});
  });

  return review;
};

var loadFilm = function (filmId, callback) {
  var url = global.parameters.filmaffinity_host + '/es/film' + filmId + '.html';

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        var numErrors = 1;

        if (global.filmError && global.filmError[filmId]) {
          numErrors = global.filmError[filmId].numErrors + 1;
          global.filmError[filmId] = {numErrors: numErrors};
        } else {
          global.filmError[filmId] = {numErrors: numErrors};
        }

        if (numErrors < global.parameters.maximum_num_errors_loading_film && response.statusCode != 404) {
          setTimeout(() => {
            handleFailedRequest('loadFilm', error, response, loadFilm(filmId, callback));
          }, global.parameters.delay_loading_films);
        } else {
          callback(new Error('Film can not be loaded'), {});
        }
      } else {
        var $ = cheerio.load(body);

        // Remove not needed stuff
        if ($(body).find('.show-akas').length) {
          $('.show-akas').remove();
          body = $.html();
        }

        var film = {
          id: filmId,
          largePosterImg: $(body).find('.lightbox').attr('href'),
          title: $(body).find('#main-title span').text().trim(),
          country: processCountry($(body).find('#country-img img').attr('src')),
          rating: $('#movie-rat-avg').attr('content') || null,
          numRatings: $('#movie-count-rat span').attr('content') || null,
          proReviews: processProReviews($),
          duration: null,
          platform: processPlatforms($),
        };

        var filmInfo = $(body).find('.movie-info');
        $(filmInfo).each(function () {
          var self = $(this);

          self.find('dt').each(function () {
            var filmField = ($(this).text());
            var filmValue = ($(this).next().text());

            if (filmField === 'Reparto') {
              const names = [];

              $('.name').each((index, element) => {
                const name = $(element).text().trim();
                names.push(name);
              });

              film.actor = names;
            } else {
              film = processFilmFieldValue(film, filmField, filmValue);
            }
          });
        });

        $ = null;
        body = null;
        filmInfo = null;

        if (!film.largePosterImg) {
          loadFilm(filmId, callback);
        } else {
          callback(null, film);
        }
      }
    });
  });
};

var loadFilmUserReviews = function (filmId, callback) {
  var url = global.parameters.filmaffinity_mobile_host + '/es/movieuserreviews.php?movie_id=' + filmId;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, false, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 /*|| captchaTriggered(body)*/) {
        handleFailedRequest('loadFilmUserReviews', error, response, loadFilmUserReviews(filmId, callback));
      } else {
        let $ = cheerio.load(body),
          reviewsDom = $(body).find('[itemprop=review]'),
          reviews = [],
          position = 0;

        reviewsDom.each(function () {
          let rating = $(this).find('.bg-user-rating').text().trim();

          if (rating === '-') {
            rating = null;
          }

          let review = {
            userId: $(this).find('[itemprop=author] a').attr('href').trim().match('id-user=(.*)')[1],
            filmId: filmId,
            username: $(this).find('[itemprop=author] strong').text().trim(),
            datePublished: new Date($(this).find('small[itemprop=datePublished]').attr('content')),
            rating: rating,
            title: $(this).find('.user-review-title').text().trim(),
            reviewText: $(this).find('.user-review-text').text().trim(),
            spoiler: $(this).find('.user-review-text-spoiler').text().trim(),
            position: position
          };

          reviews.push(review);
          position++;
        });

        $ = null;
        reviewsDom = null;

        callback(reviews);
      }
    });
  });
};

var loadFilmFrames = function (filmId, callback) {
  var url = global.parameters.filmaffinity_host + '/es/filmimages.php?movie_id=' + filmId;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200) {
        handleFailedRequest('loadFilmFrames', error, response, loadFilmFrames(filmId, callback));
      } else {
        let $ = cheerio.load(body),
          filmFramesDom = $(body).find('#type_imgs_9 .colorbox-image'),
          filmFrames = [],
          position = 0;


        $(filmFramesDom).each(function () {
          let thumb = ($(this).find('.thumbnail').attr('style')).match(/.*url\((.*)\)/)[1];
          let large = $(this).find('a').attr('href');

          let filmFrame = {
            thumb: thumb,
            large: large,
            position: position
          };

          filmFrames.push(filmFrame);
          position++;
        });

        $ = null;
        filmFramesDom = null;

        callback(filmFrames);
      }
    });
  });
};

var processPlatforms = function (htmlDom) {
  const platforms = {};

  htmlDom('#stream-wrapper .sub-title').each((i, el) => {
    const originalType = htmlDom(el).text().trim();
    let type = "";

    switch (originalType) {
      case "Suscripción":
        type = "subscription";
        break;
      case "Alquiler":
        type = "rent";
        break;
      case "Compra":
        type = "sell";
        break;
    }

    const typePlatforms = [];

    htmlDom(el).next('.prov-offers-wrapper').find('img').each((i, el) => {
      const originalPlatform = htmlDom(el).attr('alt');
      let platform = "";

      switch (originalPlatform) {
        case "Amazon Prime Video":
        case "Amazon Video":
          platform = "amazon";
          break;
        case "Apple TV Plus":
        case "Apple TV":
        case "Apple iTunes":
          platform = "apple";
          break;
        case "Disney Plus":
          platform = "disney";
          break;
        case "Filmin":
        case "Filmin Plus":
          platform = "filmin";
          break;
        case "HBO Max":
          platform = "hbo";
          break;
        case "Movistar Plus":
          platform = "movistar";
          break;
        case "Netflix":
          platform = "netflix";
          break;
        case "Google Play Movies":
          platform = "google";
          break;
      }

      if (platform.length) {
        typePlatforms.push(platform);
      }
    });

    platforms[type] = typePlatforms;
  });

  const ids = [];

  for (const type in platforms) {
    for (const platform of platforms[type]) {
      const id = utils.getIdByTypeAndPlatform(type, platform);
      if (id !== null) {
        ids.push(id);
      }
    }
  }

  return ids;
};

var getUserFriendsGroups = function (userCookie, callback) {
  var url = global.parameters.filmaffinity_host + '/es/myfriends.php';

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    requestOptions.headers.cookie = userCookie;

    request.get(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200 || captchaTriggered(body)) {
        handleFailedRequest('getUserFriendsGroups', error, response, getUserFriendsGroups(userCookie, callback));
      } else {
        var $ = cheerio.load(body);
        var friendsGroupsDom = $(body).find('[name=hd-group-id]');
        var friendsGroups = [];

        friendsGroupsDom.each(function () {
          var groupId = $(this).attr('value');

          if (groupId) {
            friendsGroups.push(groupId);
          }
        });

        $ = null;
        friendsGroupsDom = null;

        callback(friendsGroups);
      }
    });
  });
};

var getUserFriends = function (userCookie, groupId, callback) {
  var url = global.parameters.filmaffinity_host + '/es/friends.ajax.php?action=getGroupFriends&groupId=' + groupId;

  global.log.info('Loading: ' + url);

  getProxyRequestOptions(url, true, function (requestOptions) {
    requestOptions.headers.cookie = userCookie;

    request.post(requestOptions, function (error, response, body) {
      if (error || response.statusCode != 200) {
        handleFailedRequest('getUserFriends', error, response, getUserFriends(userCookie, groupId, callback));
      } else {
        try {
          var results = JSON.parse(body);
        } catch (e) {
          global.log.error('Not valid json to parse');
          callback([]);
        }

        var friends = [];

        results.friends.forEach(function (friend) {
          friends.push({id: friend.user_id, name: friend.nick});
        });

        callback(friends);
      }
    });
  });
};

module.exports = {
  getNumPagesOfFilmsStartingWithChar: getNumPagesOfFilmsStartingWithChar,
  loadFilmsPage: loadFilmsPage,
  loadTopFilmsPage: loadTopFilmsPage,
  loadPopularFilmsPage: loadPopularFilmsPage,
  loadFilmsInTheatresPage: loadFilmsInTheatresPage,
  loadNewFilmsInPlatform: loadNewFilmsInPlatform,
  loadUserLastFilmsRated: loadUserLastFilmsRated,
  loadFilm: loadFilm,
  loadFilmUserReviews: loadFilmUserReviews,
  loadFilmFrames: loadFilmFrames,
  getUserFriendsGroups: getUserFriendsGroups,
  getUserFriends: getUserFriends,
};
