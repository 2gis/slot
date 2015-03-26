var env = require('slot/env');
var serverApp = require('slot/app');
var clientApp = require('slot/app/clientApp');

// Настраиваем env
env.setup({handlebars: require('handlebars')});

// Создаём, настриваем и возвращаем инстанс слот-приложения
module.exports = function() {
    // Выбираем тип приложения
    var Application = env.isServer ? serverApp : clientApp;

    // Создаём приложение
    var app = new Application();

    // Инициализируем appState первоначальным урлом
    var appState = app.requireComponent('appState');
    app.on('initStart', function(evt) {
        evt.waitFor(function(cb) {
            appState.init(app.registry.get('url'), function() {
                cb();
            });
        });
    });

    // Обрабатываем изменение состояния
    if (env.isClient) {
        app.on('initEnd', function() {
            appState.on('statechange', function(diff) {
                app.processModules(app.mainModule.id, '*', function(instance) {
                    if (instance.changeState) {
                        instance.changeState.call(instance, diff, appState);
                    }
                }, true);

                app.runTransitions();
            });
        });
    }

    return app;
};
