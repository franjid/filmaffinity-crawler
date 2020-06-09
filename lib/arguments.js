var getAction = function(cb) {
    var availableActions = {
        'all': 'Crawls all the movies',
        'new': 'Crawls new recently added movies',
        'popular': 'Crawls most popular movies from last week',
        'theatres': 'Crawls films currently in theatres',
        'failed': 'Crawls films that previously failed to be crawled',
        'user_friends': 'Crawls friends from a user id (filmaffinity id)',
        'user_friends_ratings': 'Crawls last ratings from friends',
        'id': 'Crawls an specific film by id and outputs the film info (option used mostly for debug purposes)'
    };
    var crawlAction = process.argv[2];
    var id = null;

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

    if (crawlAction === 'user_friends' || crawlAction === 'id') {
        id = process.argv[3];

        if (!id) {
            let errorMsg = 'You need to specify a valid id.';

            console.log(errorMsg);
            global.log.error(errorMsg);
            process.exit();
        }
    }

    cb(crawlAction, id);
};

module.exports = {
    getAction: getAction
};
