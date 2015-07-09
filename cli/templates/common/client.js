exports.init = function() {
    var createApp = require('./app');
    var env = require('slot/env');

    // Загружаем конфиг, переданный в глобальной переменной config
    env.mergeConfig([window.config]);

    // Создаём приложение
    var app = createApp();

    // Инициализируем syncRegistry данными, переданными в глобальной переменной data
    var syncRegistry = app.requireComponent('syncRegistry');
    syncRegistry.setup(window.data);

    $(function() {
        var initData = {
            url: document.location.pathname
        };

        app.init(initData, function(err) {
            if (err) {
                return console.error(err.name + ': ' + err.message, err.stack);
            }

            app.bind();
        });
    });
};
