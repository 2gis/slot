var clientApp = require('./clientApp.js'),
    env = require('./env'),
    _ = require('underscore'),
    stuff = require('./stuff'),
    config = require('./config');

exports.getApp = function() {
    return clientApp();
};

function stripHash(hash) {
    if (hash.charAt(0) == '#') hash = hash.substr(1);
    if (hash.charAt(0) == '/') hash = hash.substr(1);

    var queryStringPosition = hash.indexOf('?');
    if( queryStringPosition !== -1) {
        hash = hash.substr(0, queryStringPosition);
    }

    return hash;
}

function getHashUrl() {
    return stripHash(document.location.hash);
}

function isMakeup() {
    return DEBUG && getUrl().indexOf('makeup') == 0;
}

function getUrl() {
    return document.location.pathname.substr(1);
}

exports.run = function(callback) {
    var syncRegistry = env.require('components/syncRegistry/syncRegistry')();
    syncRegistry.load(data);

    var localCfg = syncRegistry.get('cfg');
    var config = require('./config');
    config.merge(localCfg);

    var app = clientApp();
    app.wasRendered = isRendered;

    $(function() {
        var serverTime = Number($.cookie('time'));

        if (!isNaN(serverTime)) {
            time.userTimeOffset = serverTime - time.userTime;
        }

        var url;

        if (history.emulate) {
            if (isMakeup()) {
                url = getUrl();
            } else {
                url = getHashUrl();
            }
        } else {
            url = getUrl();
            if (!url && getHashUrl()) {
                app.stateNotRendered = true;
                url = getHashUrl();
                document.location.hash = '';
            }
        }
        url = decodeURIComponent(url);

        var queryArgs = stuff.uri2state(document.location.search);
        var initData = {
            url: url,
            query: queryArgs,
            city: $.cookie(config['city.cookieName']),
            host: document.location.hostname,
            protocol: document.location.protocol.slice(0,-1),
            port: document.location.port ? document.location.port : 80,
            ip: env.globals.ip,
            ua: navigator.userAgent
        };

        initData[config['authApi.cookieName']] = $.cookie(config['authApi.cookieName']);

        if (isMakeup()) {
            app.historyDisabled = true;
        }

        app.init(initData, function(err, mainModule) {
            if (err) {
                var sendError = req('lib/sendError'),
                    displayUrl = url || '/';

                try {
                    var analytics = app.requireComponent('analytics');
                    analytics.trackEvent('google', ['jserr', err.message, navigator.userAgent + ' -> ' + displayUrl]);
                } catch (ex) {
                    // pass
                }

                var error = {
                    name: err.name,
                    message: err.message,
                    userAgent: navigator.userAgent,
                    displayUrl: displayUrl,
                    url: document.location.toString()
                };

                sendError('app init error - ' + err.name, error);
                console.error(err.name + ':' + err.message, err.stack);

                if (callback) callback(err);
            } else {
                if (!isRendered) {
                    document.body.innerHTML = mainModule.render();
                }

                app.bind();

                if (callback) callback();
            }

            // Догружаем клиент-специфичный css
            // Делать это только для говнобраузеров!
        });
    });
};
