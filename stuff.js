var _ = require('lodash');

function logEnabledFor(channel) {
    if (DEBUG) {
        var config = require('./config');
        var log_channels = config['log_channels'];
        return _(log_channels).indexOf(channel) != -1;
    }
    return false;
}

/**
 * Логирует в именованый канал, активные каналы прописаны в конфиге в переменной log_channels
 * Логируется только в режиме дебага
 * @param channel
 * @param [type=debug] тип сообщения - debug, warn, error
 * @param args* аргументы для сообщения
 */
function logToChannel(channel, type) {
    type = type || 'debug';
    //noinspection JSUnresolvedVariable
    if (DEBUG) {
        if (logEnabledFor(channel)) {
            var args = [].slice.call(arguments, 2);
            if (typeof console != "undefined") {
                // in IE9 console.log is not a function
                // thanks to k.likhter for beautifull solution
                Function.prototype.apply.call(console[type], console, args);
            }
        }
    }
}

var stuff = module.exports = {

    /**
     * Форматирует строку, пример использования _.format("Hello %1 and %2", "Vasya", "Petya")
     * @param str
     * @returns {String}
     */
    format: function(str) {
        var values =  arguments;

        return str.replace(/%(\d+)/g, function(m, num) {
            num = parseInt(num, 10);
            return values[num];
        });
    },

    /**
     * Логирует в заданный канал
     * @param channel канал
     * @param args* аргументы для сообщения
     */
    log: function() {
        var args = [].slice.call(arguments);
        args.splice(1, 0, 'log');
        logToChannel.apply(this, args);
    },

    logEnabledFor: logEnabledFor,

    /**
     * Логирует в канал warn
     * @param args* аргументы для сообщения
     */
    warn: function() {
        var args = [].slice.call(arguments);
        args.splice(0, 0, 'warn', 'warn');
        logToChannel.apply(this, args);
    },

    /**
     * Логирует в канал error
     * @param args* аргументы для сообщения
     */
    error: function() {
        var args = [].slice.call(arguments);
        args.splice(0, 0, 'error', 'error');
        logToChannel.apply(this, args);
    },

    /**
     * Преобразует первый символ строки в заглавный
     *
     * @param str
     * @returns {string}
     */
    capitalize: function (str) {
        str = str == null ? '' : String(str);
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Удаляет с конца массива переданное значение
     * @param value
     */
    pop: function(array, value) {
        var lastIndex = _.lastIndexOf(array, value);
        if (lastIndex != -1) {
            array.splice(lastIndex, 1);
        }
    },


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

    deepClone: function(obj) {
        if (!_.isObject(obj)) return obj;
        if (_.isArray(obj)) {
            return _.map(obj, function(elem) {
                return stuff.deepClone(elem);
            });
        }
        var x = {};
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                x[name] = stuff.deepClone(obj[name]);
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
};