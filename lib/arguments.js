var getAction = function(cb) {
    var availableActions = {
        'all': 'Crawls all the movies',
        'new': 'Crawls new recently added movies',
        'popular': 'Crawls most popular movies from last week',
        'theatres': 'Crawls films currently in theatres',
        'new_platform': 'Crawls new films by platform',
        'failed': 'Crawls films that previously failed to be crawled',
        'user_friends': 'Crawls friends from a user id (filmaffinity id)',
        'user_friends_ratings': 'Crawls last ratings from users friends',
        'user_friends_films': 'Crawls last films rated from friends (so those films are up to date)',
        'id': 'Crawls an specific film by id and outputs the film info (option used mostly for debug purposes)'
    };
    var crawlAction = process.argv[2];
    var secondary_argument = null;

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
        secondary_argument = process.argv[3];

        if (!secondary_argument) {
            let errorMsg = 'You need to specify a valid id.';

            console.log(errorMsg);
            global.log.error(errorMsg);
            process.exit();
        }
    }

    if (crawlAction === 'new_platform') {
        secondary_argument = process.argv[3];
        const available_platforms = ['amazon', 'apple', 'disney', 'hbo', 'netflix'];

        if (!secondary_argument || (!available_platforms.includes(secondary_argument))) {
            let errorMsg = `You need to specify a valid platform (${available_platforms.join(", ")})`;

            console.log(errorMsg);
            global.log.error(errorMsg);
            process.exit();
        }
    }

    cb(crawlAction, secondary_argument);
};

module.exports = {
    getAction: getAction
};
