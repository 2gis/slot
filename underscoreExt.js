
var _ = require('underscore');
var config = require('./config');

function logEnabledFor(channel) {
    if (DEBUG) {
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

_.mixin({
    noop: function() {},

    trim: function(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    ltrim: function(str) {
        return str.replace(/^\s+/, '');
    },

    rtrim: function(str) {
        return str.replace(/\s+$/, '');
    },

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
    }
});
