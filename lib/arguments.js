var getAction = function(cb) {
    var availableActions = {
        'all': 'Crawls all the movies',
        'new': 'Crawls new recently added movies',
        'popular': 'Crawls most popular movies from last week',
        'theatres': 'Crawls films currently in theatres and flag them in the database'
    };
    var crawlAction = process.argv[2];

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

    cb(crawlAction);
};

module.exports = {
    getAction: getAction
};
