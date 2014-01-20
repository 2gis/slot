
var rootPath = './',
    _ = require('underscore');

exports.setRootPath = function(path) {
    rootPath = path;
    if (!_(rootPath).endsWith('/')) {
        rootPath = rootPath + '/';
    }
};

exports.getRootPath = function() {
    return rootPath;
};

function getBuildPath() {
    return rootPath + 'build/';
}

/**
 * Запрашивает модуль относительно корня проекта
 *
 * @param name
 * @returns {*}
 */
exports.require = function(name) {
    if (!_(name).endsWith('.js')) {
        name = name + '.js';
    }
    return require(rootPath + name);
};

/**
 * Возвращает глобальный контекст среды исполнения (в node.js или браузере)
 *
 * @returns {global|window}
 */
function globals() {
    return typeof global != 'undefined' ? global : window;
}

exports.globals = globals;

/**
 * Запрашивает модуль относительно папки куда складываются собираемые файлы
 *
 * @param name
 * @returns {*}
 */
exports.requirePrivate = function(name) {
    return require(getBuildPath() + 'private/' + name + '.js');
};

globals().requirePrivate = exports.requirePrivate;

var isServer = typeof window == 'undefined';

/**
 * Определяем, Грым ли это (Грым это десктопная версия 2gis).
 */
exports.isGrym = typeof DGOfflineAPI != 'undefined' && DGOfflineAPI.systemContext;
exports.isServer = isServer;
exports.isClient = !isServer;

_.mixin({

    /**
     * Get property for object by path like prop1.prop2.prop3
     * @param obj
     * @param path
     * @param String [separator=.] Separotor for splitting path
     * @returns {*}
     */
    getByPath: function(obj, path, separator) {
        separator = separator || '.';
        var paths = path.split(separator);

        while (paths.length && obj) {
            obj = obj[paths.shift()];
        }

        return obj;
    },

    startsWith: function(str, value) {
        return _.isString(str) && str.substr(0, value.length) == value;
    },

    endsWith: function(str, value) {
        return _.isString(str) && str.substr(-value.length) == value;
    },

    deepClone: function(obj) {
        if (!_.isObject(obj)) return obj;
        if (_.isArray(obj)) {
            return _.map(obj, function(elem) {
                return _.deepClone(elem);
            });
        }
        var x = {};
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                x[name] = _.deepClone(obj[name]);
            }
        }

        return x;
    },

    state2uri: function(state, encode) {
        var parts = [];
        for (var key in state) {
            var value = state[key];
            if (encode || encode == null) {
                value = encodeURIComponent(value);
            }
            parts.push(key + '=' + value);
        }
        return parts.join('&');
    },

    uri2state: function(uri, decode) {
        if (uri.charAt(0) == '?') uri = uri.substr(1);
        var parts = uri.split('&');
        var result = {};
        _.each(parts, function(part) {
            if (!part) return;
            part.replace(/([^=]+)\=?(.*)/g, function(m, name, value) {
                if (decode || decode == null) {
                    value = decodeURIComponent(value);
                }
                result[name] = value;
            });
        });

        return result;
    }
});

RegExp.escape = RegExp.escape || function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

function envRequire(serverName, clientName) {
    if (isServer) {
        return require(serverName);
    } else {
        if (!clientName) {
            clientName = serverName.charAt(0).toUpperCase() + serverName.substr(1);
            clientName = window[clientName] ? clientName : serverName;
        }
        return window[clientName];
    }
}


// ---- expose same functions as globals -----

globals().req = exports.require;
globals().envRequire = envRequire;

if (!Object.freeze) Object.freeze = _.identity;

