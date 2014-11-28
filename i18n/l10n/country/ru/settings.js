module.exports = {
    dashboard: {
        promoblocks: [
            [
                'dexp'
            ], [
                'entrances',
                'push2dial'
            ], [
                'dialer'
            ], [
                'extension'
            ]
        ]
    },
    socials: ['vkontakte', 'facebook', 'twitter', 'odnoklassniki'],
    cityselect: {
        countries: ['ru', 'ua', 'kz']
    },
    parkingsMode: {
        radius: 250,
        disable: false
    },
    filtersInTitles: true,
    tools: {
        extension: true,
        extensionInlineInstall: true,
        downloadBtn: true
    },
    entrancesPromo: {
        firmQuery: '2ГИС, городской информационный справочник',
        excludeProjects: [
            62, // Брянск
            85, // Саранск
            47, // Тверь
            60  // Старый Оскол
        ]
    }
};