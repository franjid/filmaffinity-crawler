var async = require('async');
var rangegen = require('rangegen');
var progressBar = require('progress');

var db = require(__dirname + '/../db.js');
var crawler = require(__dirname + '/../crawler.js');
var generalAction = require(__dirname + '/_generalAction.js');

var start = function () {
  var dbPool = db.getPool();
  /**
   * At the moment of writing this, last page with results was 1696
   * But don't worry, when we get to the last page with no results, we will finish
   */
  var numPages = 2000;

  global.log.info('Crawling top films');

  var bar = new progressBar(':bar', {total: parseInt(numPages), clear: true});
  var pages = rangegen(0, numPages);

  async.forEachLimit(pages, 2, function (page, loadTopFilmsPage) {
    crawler.loadTopFilmsPage(page, function (films) {
      if (films) {
        async.each(films, function (filmId, loadFilm) {
          generalAction.addFilm(dbPool, filmId);
          loadFilm();
        }, function (err) {
          if (err) {
            throw err;
          }

          global.log.info('All film ids from page ' + page + ' are imported (total pages ' + numPages + ')');
          bar.tick();
          loadTopFilmsPage();
        });
      } else {
        console.log('No more films to crawl');
        setTimeout(()=> { process.exit(0); }, 60000); // Ensure we kill the process after some grace period
      }
    });
  });
};

module.exports = {
  start: start
};
