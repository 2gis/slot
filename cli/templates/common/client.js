exports.init = function() {
    var handlebars = require('handlebars');

    var App = require('slot/app/clientApp');
    var env = require('slot/env');

    env.setup({handlebars: handlebars});
    env.mergeConfig([window.config]);

    var app = new App();
    var syncRegistry = app.requireComponent('syncRegistry');
    syncRegistry.load(data);

    $(function() {
        var initData = {
            url: decodeURIComponent(document.location.hash),
            host: document.location.hostname,
            protocol: document.location.protocol.slice(0, -1),
            port: document.location.port ? document.location.port : 80,
            ua: navigator.userAgent
        };

        app.init(initData, function(err) {
            if (err) {
                return console.error(err.name + ': ' + err.message, err.stack);
            }

            app.bind();
        });
    });
};
