var request = require('request');
var useragent = require('random-useragent');
var cheerio = require('cheerio');

var getNumPagesOfFilmsStartingWithChar = function (char, callback) {
    var url = global.parameters.filmaffinity_host + '/es/allfilms_' + char + '_1.html';

    console.log('Loading: ' + url);

    var options = {
        url: url,
        timeout: 5000,
        headers: {
            'User-Agent': useragent.getRandom()
        }
    };

    request.get(options, function (error, response, body) {
        if (error || response.statusCode != 200) {
            getNumPagesOfFilmsStartingWithChar(char, callback); // Keep trying until we get something
        }
        else
        {
            var $ = cheerio.load(body);
            var numPages = $($(body).find('table tr td b')[30]).text();

            callback(char, numPages);
        }
    });
};

var loadFilmsPages = function(char, page, callback) {
    var kk = 0;
    var url = global.parameters.filmaffinity_host + '/es/allfilms_' + char + '_' + page + '.html';

    console.log('Loading: ' + url);

    var options = {
        url: url,
        timeout: 5000,
        headers: {
            'User-Agent': useragent.getRandom()
        }
    };

    request.get(options, function (error, response, body) {
        if (error || response.statusCode != 200) {
            loadFilmsPages(char, page, callback); // Keep trying until we get something
        }
        else
        {
            var $ = cheerio.load(body);
            var films = $(body).find('#all-films-wrapper .all-films-movie .movie-card .mc-poster a');

            films.each(function() {
                var filmId = $(this).attr('href').match('/es/film(.*).html')[1];

                if (kk <= 0) {
                    callback(filmId);
                }
                //kk++;
            });
        }
    });
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
    return countryFlagUrl.match('/imgs/countries/(.*).jpg')[1].toLowerCase();
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
    //var filmId = 637349;
    var url = global.parameters.filmaffinity_host + '/es/film' + filmId + '.html';

    console.log('Loading: ' + url);

    var options = {
        url: url,
        timeout: 5000,
        headers: {
            'User-Agent': useragent.getRandom()
        }
    };

    request.get(options, function (error, response, body) {
        if (error || response.statusCode != 200) {
            loadFilm(filmId, callback); // Keep trying until we get something
        }
        else
        {
            var $ = cheerio.load(body);

            // Remove shit
            if ($(body).find('.show-akas').length) {
                $('.show-akas').remove();
                body = $.html();
            }

            var film = {};
            film.id = filmId;
            film.largePosterImg = $(body).find('.lightbox').attr('href');
            film.title = $(body).find('#main-title span').text().trim();
            film.country = processCountry($(body).find('#country-img img').attr('src'));
            film.rating = $('#movie-rat-avg').attr('content') || null;
            film.numRatings = $('#movie-count-rat span').attr('content') || null;
            film.officialReviews = processOfficialReviews($);

            var filmInfo = $(body).find('.movie-info');
            $(filmInfo).each(function() {
                var self = $(this);

                self.find('dt').each(function() {
                    var filmField = ($(this).text());
                    var filmValue = ($(this).next().text());

                    film = processFilmFieldValue(film, filmField, filmValue);
                });

            });

            callback(film);
        }
    });
};

module.exports = {
    getNumPagesOfFilmsStartingWithChar : getNumPagesOfFilmsStartingWithChar,
    loadFilmsPages : loadFilmsPages,
    loadFilm: loadFilm
};

