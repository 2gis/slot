/**
 * @module config
 */

var env = require('./env'),
    _ = require('lodash');

var config = typeof window == 'undefined' ? env.requirePrivate('config') : {};

env.global.DEBUG = config.debug;


module.exports = config;

/**
 * Пробегает по объекту конфига, выбирая свойства,
 * которые соответствуют неймспейсу `namespace`
 *
 * @param {string} namespace Неймспейс
 * @returns {Object} Конфиг от неймспейса
 */
module.exports.group = function(namespace) {
    var groupConfig = {};

    _.forOwn(config, function(value, key) {
        if (key.startsWith(namespace + '.')) {
            key = key.substr(namespace.length + 1);
            groupConfig[key] = value;
        }
    });

    return groupConfig;
};

/**
 * Мержит конфиг с `otherConfig`,
 * при этом, если ключ в `otherConfig` начинается c '+',
 * и значение в конфиге, соответствующее этому ключу, является массивом,
 * тогда в этот массив добавляется это значение
 *
 * @param {Object} otherConfig Объект-конфиг, который мержится с оригинальным конфигом
 * @returns {Object} Оригинальный конфиг
 */
module.exports.merge = function(otherConfig) {
    _.forOwn(otherConfig, function(value, key) {
        var shouldBePushed = false;

        if (key.startsWith('+')) {
            key = key.substr(1);
            shouldBePushed = true;
        }

        var originalValue = config[key];

        if (shouldBePushed && _.isArray(originalValue)) {
            originalValue.push.apply(originalValue, value);
        } else {
            config[key] = value;
        }
    });

    return config;
};
