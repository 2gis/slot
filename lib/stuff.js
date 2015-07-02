/**
 * @module stuff
 */

var _ = require('lodash');

/**
 * @private
 *
 * @param {string} channel
 * @returns {boolean}
 */
function logEnabledFor(channel) {
    if (DEBUG) {
        var config = require('../config');
        var log_channels = config['log_channels'];
        return _(log_channels).indexOf(channel) != -1;
    }
    return false;
}

/**
 * Логирует в именованый канал, активные каналы прописаны в конфиге в переменной `log_channels`.
 * Логируется только в режиме дебага.
 *
 * @private
 *
 * @param {string} channel
 * @param {string} [type='debug'] - Тип сообщения (debug, warn или error).
 * @param {...string} args - Аргументы для сообщения.
 */
function logToChannel(channel, type, args) {
    type = type || 'debug';

    // noinspection JSUnresolvedVariable
    if (DEBUG) {
        if (logEnabledFor(channel)) {
            args = [].slice.call(arguments, 2);

            if (typeof console != "undefined") {
                // in IE9 console.log is not a function
                // thanks to k.likhter for beautiful solution
                Function.prototype.apply.call(console[type], console, args);
            }
        }
    }
}

    /**
     * Форматирует строку.
     *
     * @example
     * _.format('Hello %1 and %2', 'Vasya', 'Petya'); // => 'Hello Vasya and Petya'
     *
     * @param {string} str - Форматируемая строка.
     * @param {...Array} values - Значения для форматирования.
     * @returns {string} Отформатированная строка.
     */
exports.format = function(str) {
    var values =  arguments;

    return str.replace(/%(\d+)/g, function(m, num) {
        num = parseInt(num, 10);
        return values[num];
    });
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

/**
 * Логирует в заданный канал.
 *
 * @param {string} channel - Канал.
 * @param {...string} args - Аргументы сообщения.
 */
exports.log = function(channel, args) {
    args = [].slice.call(arguments);
    args.splice(1, 0, 'log');
    logToChannel.apply(this, args);
};

/**
 * @function
 *
 * @param {string} cannel
 * @returns {boolean}
 */
exports.logEnabledFor = logEnabledFor;

/**
 * Логирует в канал `warn`.
 *
 * @param {...string} args - Аргументы сообщения.
 */
exports.warn = function(args) {
    args = [].slice.call(arguments);
    args.unshift('warn', 'warn');
    logToChannel.apply(this, args);
};

/**
 * Логирует в канал `error`.
 *
 * @param {...string} args - Аргументы сообщения.
 */
exports.error = function(args) {
    args = [].slice.call(arguments);
    args.unshift('error', 'error');
    logToChannel.apply(this, args);
};

/**
 * Преобразует первый символ строки в заглавный.
 *
 * @param {string} str - Исходная строка.
 * @returns {string}
 */
exports.capitalize = function(str) {
    str = str == null ? '' : String(str);
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Удаляет с конца массива переданное значение.
 *
 * @param {Array} array
 * @param {*} value
 */
exports.pop = function(array, value) {
    var lastIndex = _.lastIndexOf(array, value);

    if (lastIndex != -1) {
        array.splice(lastIndex, 1);
    }
};

/**
 * Get property for object by path like `prop1.prop2.prop3`.
 *
 * @param {Object} obj
 * @param {string} path
 * @param {string} [separator=.] - Separotor for splitting path.
 * @returns {*}
 */
exports.getByPath = function(obj, path, separator) {
    separator = separator || '.';
    var paths = path.split(separator);

    while (paths.length && obj) {
        obj = obj[paths.shift()];
    }

    return obj;
};

exports.state2uri = function(state) {
    var parts = [];
    for (var key in state) {
        var value = encodeURIComponent(state[key]);
        parts.push(key + '=' + value);
    }
    return parts.join('&');
};

exports.uri2state = function(uri) {
    if (uri.charAt(0) == '?') uri = uri.substr(1);
    var parts = uri.split('&');
    var result = {};
    _.each(parts, function(part) {
        if (!part) return;
        part.replace(/([^=]+)\=?(.*)/g, function(m, name, value) {
            result[name] = decodeURIComponent(value);
        });
    });

    return result;
};
