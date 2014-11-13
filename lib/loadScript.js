var _ = require('lodash'),
    env = require('../env');

var scripts = {},
    testClient;

/**
 * Загружает скрипт по ссылке url 1 раз, или каждый раз если refresh == true. Когда скрипт загружен дёргает success.
 * @param  {String} url путь до загружаемого скрипта
 * @param  {Function} success колбек выполняемый после загрузки скрипта
 * @param  {Boolean} refresh флаг, принудительно перезагрузающий скрипт
 */
module.exports = function(url, success, refresh) {
    if (!env.isClient && !testClient) throw new Error('[slot loadScript] library should be used only client-side!');

    success = success || function() {};

    if (!refresh && scripts[url]) {
        if (scripts[url].loaded) {
            success();
        } else {
            scripts[url].callbacks.push(success);
        }
    } else { // Если refresh не был передан, сюда заходит только 1 раз для данного url
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        document.documentElement.appendChild(script);

        scripts[url] = {
            loaded: false,
            callbacks: [success]
        };

        script.onload = function() {
            if (!scripts[url].loaded) {
                _.each(scripts[url].callbacks, function(cb) {
                    cb();
                });

                scripts[url].loaded = true;
            }
        };

        // Для ИЕ8 - не проверялось
        script.onreadystatechange = function() {
            var self = this;

            if (this.readyState == "complete" || this.readyState == "loaded") {
                setTimeout(function() {
                    self.onload();
                }, 0);
            }
        };
    }
};

module.exports.mock = function(params) {
    testClient = params.isClient;
};
