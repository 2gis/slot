// Настройки по-умолчанию
module.exports = {
    dashboard: {
        metarubrics: [
            'cafe',
            'hotel',
//            'pharmacy',
            'tireService', // это сезонное решение
            'newlyBuilt',
            'all'
        ],
        metarubricsGrym: [
            'cafe',
            'hotel',
            'pharmacy',
            'newlyBuilt',
            'carservice'
        ],
        promoblocks: [],
        // список дефолтных промок для всех локалей в грыме
        promoblocksGrym: [
            [
                'entrances',
                'photos'
            ], [
                'dialer'
            ]
        ]
    },
    noresults: {
        metarubrics: [
            'cafe',
            'hotel',
            'pharmacy',
            'newlyBuilt'
        ]
    },
    socials: ['twitter', 'facebook'],
    cityselect: {
        countries: []
    },
    geoobjects: {
        avoidAddressInName: false,
        infoStrategy: 'default',
        showNearStationDistance: false
    },
    // Список продуктов в дашборде для скачивания
    mobileAppPlatforms: ['android', 'ios', 'windowsphone', 'blackberry'],
    firms: {
        showDrilldown: false,
        showStations: false
    },
    feedback: {
        reverseRatingOrder: false
    },
    traffic: {
        isLeftHand: false
    },
    parkingsMode: {
        radius: 150,
        disable: false
    },
    filtersInTitles: false,
    tools: {
        // Есть ли расширение для браузера
        extension: false,
        extensionInlineInstall: false
    },
    entrancesPromo: {
        // запрос, по которому ищем карточку 2гиса
        firmQuery: '2ГИС, городской информационный справочник',
        // проекты, для которых промку не показываем
        excludeProjects: []
    }
};
