/**
 * @Deprecated
 *
 * Looks like Filmaffinity decided to delete their alphabetically list of films
 * We now have to rely on the "top": /es/topgen.php [./all.js]
 */
var async = require('async');
var rangegen = require('rangegen');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function() {
    var dbPool = db.getPool(),
        charsToLookFor = [],
        letters = rangegen('A', 'Z');

    charsToLookFor.push('0-9');
    charsToLookFor = charsToLookFor.concat(letters);

    async.forEachLimit(charsToLookFor, 1, function (char, getCharNumberFilmPages) {
            global.log.info('Getting number of pages for ' + char);

            crawler.getNumPagesOfFilmsStartingWithChar(char, function (char, numPages) {
                var infoMessage = 'Crawling films starting with char [' + char + '] | ' + numPages + ' pages:';
                global.log.info(infoMessage);
                console.log(infoMessage);

                var bar = new progressBar(':bar', { total: parseInt(numPages), clear: true });
                var pages = rangegen(1, numPages);

                async.forEachLimit(pages, 2, function (page, loadCharFilmPage) {
                    crawler.loadFilmsPage('/es/allfilms_' + char + '_' + page + '.html', function (films) {
                        async.each(films, function(filmId, loadFilm) {
                            generalAction.addFilm(dbPool, filmId);
                            loadFilm();
                        }, function(err) {
                            if (err) {
                                throw err;
                            }

                            global.log.info('All film ids from page ' +
                                page + ' in [' + char + '] are imported (total pages ' + numPages + ')'
                            );
                            bar.tick();
                            loadCharFilmPage();
                        });
                    });

                    if (page == numPages) {
                        getCharNumberFilmPages();
                    }
                });
            });
        },
        function (err) {
            if (err) {
                throw err;
            }

            console.log('All done');
        }
    );
};

module.exports = {
    start : start
};
