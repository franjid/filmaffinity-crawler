var getAction = function(cb) {
    var availableActions = {
        'all': 'Crawls all the movies',
        'new': 'Crawls new recently added movies',
        'popular': 'Crawls most popular movies from last week',
        'theatres': 'Crawls films currently in theatres',
        'failed': 'Crawls films that previously failed to be crawled',
        'id': 'Crawls an specific film by id and outputs the film info (option used mostly for debug purposes)'
    };
    var crawlAction = process.argv[2];
    var filmId = null;

    if (!crawlAction || !(crawlAction in availableActions)) {
        var noActionMsg =
            'You need to specify a valid action for the crawler.\n\n' +
            'Available actions:\n\n';

        for (var action in availableActions) {
            if (availableActions.hasOwnProperty(action)) {
                noActionMsg = noActionMsg + action + ': ' + availableActions[action] + '\n';
            }
        }

        console.log(noActionMsg);
        global.log.error(noActionMsg);
        process.exit();
    }

    if (crawlAction === 'id') {
        filmId = process.argv[3];

        if (!filmId) {
            let errorMsg = 'You need to specify a valid film id.';

            console.log(errorMsg);
            global.log.error(errorMsg);
            process.exit();
        }
    }

    cb(crawlAction, filmId);
};

module.exports = {
    getAction: getAction
};
