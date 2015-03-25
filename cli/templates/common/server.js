var path = require('path');
var express = require('express');
var handlebars = require('handlebars');
var cookieParser = require('cookie-parser');

var env = require('slot/env');
var createApp = require('./app');

var rootPath = __dirname;
var staticPath = path.join(rootPath, 'build/public');

// Настройка окружения слота
env.setRootPath(rootPath);
env.mergeConfig([env.requirePrivate('config')]);

// Загружаем шаблон для лэйаута
var templateProvider = require('slot/lib/templateProvider');
var layoutsSpec = env.requirePrivate('jst_layouts');
var layoutTemplate = templateProvider.compileTemplates(layoutsSpec, handlebars)['layout'];

var server = express();

server.use(cookieParser());
server.use(express.static(staticPath));

server.get('/*', function(req, res) {
    var app = createApp();

    var initData = {
        url: req.url
    };

    app.init(initData, function(err, mainModule) {
        if (err) {
            return console.error(err.name + ': ' + err.message, err.stack);
        }

        var syncRegistry = app.requireComponent('syncRegistry');

        var html = layoutTemplate({
            content: mainModule.render(),
            data: JSON.stringify(syncRegistry.read())
        });

        res.send(html);
    });
});

server.listen(3000);
console.log('Server is listening on port 3000');
