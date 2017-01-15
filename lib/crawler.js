var request = require('request');
var http = require('http');

var useragent = require('random-useragent');
var cheerio = require('cheerio');
var exec = require('child_process').exec;
//var dbImport = require(__dirname + '/dbImport.js');

var getRequestOptions = function(url) {
    return {
        url: url,
        proxy: global.parameters.proxy,
        timeout: 10000,
        headers: {
            'User-Agent': useragent.getRandom()
        }
    };
};

var handleFailedRequest = function(requestFuncName, error, response) {
    global.log.error('Some error happened with request in ' + requestFuncName);
    global.log.error(error);

    if (response && response.statusCode) {
        global.log.error(response.statusCode + "\n");
    }

    global.log.info('Refreshing Tor IP...');

    try {
        var command = 'echo \'AUTHENTICATE ""\\nsignal NEWNYM\\nQUIT\' | nc localhost 9051';
        exec(command, function (error, out) {
            if (error) {
                global.log.error('Error on exec: ' + command);
                global.log.error(error);
                global.log.error(out);
            }
        });
    } catch (e) {
        global.log.error("Catched exec error: " + e);
    }
};

var getNumPagesOfFilmsStartingWithChar = function (char, callback) {
    var url = global.parameters.filmaffinity_host + '/es/allfilms_' + char + '_1.html';

    global.log.info('Loading: ' + url);

    request.get(getRequestOptions(url), function (error, response, body) {
        if (error || response.statusCode != 200 || captchaTriggered(body)) {
            handleFailedRequest('getNumPagesOfFilmsStartingWithChar', error, response);
            getNumPagesOfFilmsStartingWithChar(char, callback); // Keep trying until we get something
        }
        else
        {
            var $ = cheerio.load(body);
            var numPages = $($(body).find('table tr td b')[29]).text();

            $ = null;

            callback(char, numPages);
        }
    });
};

var loadFilmsPages = function(char, page, callback) {
    var url = global.parameters.filmaffinity_host + '/es/allfilms_' + char + '_' + page + '.html';

    global.log.info('Loading: ' + url);

    request.get(getRequestOptions(url), function (error, response, body) {
        if (error || response.statusCode != 200 || captchaTriggered(body)) {
            handleFailedRequest('loadFilmsPages', error, response);
            loadFilmsPages(char, page, callback); // Keep trying until we get something
        }
        else
        {
            var $ = cheerio.load(body);
            var filmsDom = $(body).find('#all-films-wrapper .all-films-movie .movie-card .mc-poster a');
            var films = [];

            filmsDom.each(function() {
                films.push($(this).attr('href').match('/es/film(.*).html')[1]);
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
};

var captchaTriggered = function(body) {
    var $ = cheerio.load(body);

    return !!$(body).find('.alert').text().length;
};

var processFilmFieldValue = function(film, field, value) {
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
        case "Director":
            film.director = processParticipants(replaceParenthesis(value.trim()));
            break;
        case "Guión":
            film.screenplayer = processParticipants(replaceParenthesis(value.trim()));
            break;
        case "Música":
            film.musician = processParticipants(replaceParenthesis(value.trim()));
            break;
        case "Fotografía":
            film.cinematographer = processParticipants(replaceParenthesis(value.trim()));
            break;
        case "Reparto":
            film.actor = processParticipants(replaceParenthesis(value.trim()));
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

var replaceParenthesis = function(string) {
    return string.replace(/\s*\(.*?\)\s*/g, '');
};

var processCountry = function(countryFlagUrl) {
    return typeof countryFlagUrl !== 'undefined' && countryFlagUrl !== null
                ? countryFlagUrl.match('/imgs/countries/(.*).jpg')[1].toLowerCase()
                : 'zz';
};

var processParticipants = function(peopleString) {
    return peopleString.split(/,\s*/);
};

var processGenre = function(genreTopic) {
    return (genreTopic.split(' |')[0]).split(/\.\s*/);
};

var processTopic = function(genreTopic) {
    var genreTopicSplit = genreTopic.split(' |');

    return genreTopicSplit[1] ? genreTopicSplit[1].trim().split(/\.\s*/) : [];
};

var processOfficialReviews = function(htmlDom) {
    var review = [];

    htmlDom('#pro-reviews .pro-review').each(function() {
        var reviewBody = htmlDom(this).find('[itemprop=reviewBody]').text().trim();
        var reviewAuthor = htmlDom(this).find('[itemprop=author]').text().trim();

        review.push({'review': reviewBody, 'author': reviewAuthor});
    });

    return review;
};

var loadFilm = function(filmId, callback) {
    var url = global.parameters.filmaffinity_host + '/es/film' + filmId + '.html';

    global.log.info('Loading: ' + url);

    request.get(getRequestOptions(url), function (error, response, body) {
        if (error || response.statusCode != 200 || captchaTriggered(body)) {
            var numErrors = 1;

            if (global.filmError[filmId]) {
                numErrors = global.filmError[filmId].numErrors + 1;
            }

            global.filmError[filmId] = {numErrors: numErrors};

            if (numErrors <= global.parameters.maximum_num_errors_loading_film) {
                handleFailedRequest('loadFilm', error, response);
                loadFilm(filmId, callback);
            }/* else {
                global.log.warning('Store film id in database to try to crawl later: ' + filmId);
                dbImport.insertFailedCrawlFilm(filmId);
            }*/
        }
        else
        {
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
                officialReviews: processOfficialReviews($),
                duration: null
            };

            var filmInfo = $(body).find('.movie-info');
            $(filmInfo).each(function() {
                var self = $(this);

                self.find('dt').each(function() {
                    var filmField = ($(this).text());
                    var filmValue = ($(this).next().text());

                    film = processFilmFieldValue(film, filmField, filmValue);
                });

            });

            $ = null;
            body = null;
            filmInfo = null;

            callback(film);
        }
    });
};

module.exports = {
    getNumPagesOfFilmsStartingWithChar : getNumPagesOfFilmsStartingWithChar,
    loadFilmsPages : loadFilmsPages,
    loadFilm: loadFilm
};
