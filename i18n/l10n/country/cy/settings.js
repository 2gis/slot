module.exports = {
    cityselect: {
        countries: ['cy']
    },
    mobileAppPlatforms: ['android', 'ios', 'blackberry'],
    dashboard: {
        promoblocks: [
            [
                'entrances',
                'push2dial'
            ], [
                'dialer'
            ], [
                'extension'
            ]
        ],
        metarubrics: ['cafe', 'hotel', 'pharmacy', 'atm', 'all']
    },
    noresults: {
        metarubrics: [
            'cafe',
            'hotel',
            'pharmacy',
            'atm'
        ]
    },
    traffic: {
        isLeftHand: true
    },
    tools: {
        extension: true,
        extensionInlineInstall: false,
        downloadBtn: true
    },
    entrancesPromo: {
        firmQuery: '2GIS - City Information Directory',
        excludeProjects: [
            104 // Nicosia
        ]
    }
};