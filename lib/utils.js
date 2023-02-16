const getIdByTypeAndPlatform = (type, platform) => {
    const data = [
        {id: 1, type: 'subscription', platform: 'amazon'},
        {id: 2, type: 'subscription', platform: 'apple'},
        {id: 3, type: 'subscription', platform: 'disney'},
        {id: 4, type: 'subscription', platform: 'filmin'},
        {id: 5, type: 'subscription', platform: 'hbo'},
        {id: 6, type: 'subscription', platform: 'movistar'},
        {id: 7, type: 'subscription', platform: 'netflix'},
        {id: 8, type: 'rent', platform: 'amazon'},
        {id: 9, type: 'rent', platform: 'apple'},
        {id: 10, type: 'rent', platform: 'filmin'},
        {id: 11, type: 'rent', platform: 'google'},
        {id: 12, type: 'sell', platform: 'amazon'},
        {id: 13, type: 'sell', platform: 'apple'},
        {id: 14, type: 'sell', platform: 'google'},
    ];

    const result = data.find(item => item.type === type && item.platform === platform);

    return result ? result.id : null;
}

module.exports = {
    getIdByTypeAndPlatform: getIdByTypeAndPlatform
};
