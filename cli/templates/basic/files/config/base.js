exports['mainModule'] = 'hello';

// Страницы разработчиков. Например, по адресу localhost:3000/makeup приложение будет загружать модуль makeup в качестве главного
exports.devPages = {
    'makeup': { // slug
        module: 'makeup',
        history: false
    }
};
