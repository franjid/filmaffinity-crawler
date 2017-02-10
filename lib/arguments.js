var getAction = function(cb) {
    var availableActions = {
        'all': 'Crawls all the movies',
        'popular': 'Crawls most popular movies from last week'
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