module.exports = {
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
    cityselect: {
        countries: ['ae']
    },
    geoobjects: {
        avoidAddressInName: true,
        infoStrategy: 'ae',
        showNearStationDistance: true
    },
    firms: {
        showDrilldown: true,
        showStations: true
    },
    mobileAppPlatforms: ['android', 'ios', 'blackberry'],
    tools: {
        extension: true,
        extensionInlineInstall: false,
        downloadBtn: true
    },
    entrancesPromo: {
        firmQuery: '2GIS, City Information Directory'
    }
};