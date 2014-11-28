
var _ = require('lodash');
var env = require('slot/env');
var isServer = env.isServer;
var loadScript = req('lib/loadScript');

/**
 * @param {String} locale
 * @returns {String} путь до локализационных данных
 */
function getPath(locale) {
    var stamp = null;
    if (!DEBUG && !TEST) {
        stamp = isServer ? env.requirePrivate('stamp') : data.stamp;
    }

    return _.compact(['assets', stamp, 'l10n', locale + '.js']).join('/');
}

/**
 * Загружает файл локализации в браузер
 * @param  {String}   locale
 * @param  {Function} callback
 */
function download(locale, callback) {
    var path = getPath(locale);
    loadScript('/' + path, function passDownloadedLocaleData() {
        var localeData = window.localeData;
        callback(localeData && localeData[locale]);
    });
}

/**
 * Находит и при необходимости загружает нужные данные локализации на стороне клиента
 * @param  {String}   locale
 * @param  {Function} callback
 */
function clientLoad(locale, callback) {
    var localeData = window.localeData;
    if (localeData && localeData[locale]) {
        // Если данные уже загружены - это хорошо
        callback(localeData[locale]);
    } else {
        // Если нет - загружаем
        download(locale, callback);
    }
}

/**
 * Подключачает нужные данные локализации на стороне сервера
 * @param  {String}   locale
 * @param  {Function} callback
 */
function serverLoad(locale, callback) {
    var path = getPath(locale);
    // На сервере просто подключаем
    localeData = env.requirePublic(path)['localeData'];
    callback(localeData && localeData[locale]);
}

/**
 * Загружает данные в завимости от локали и окружения
 * @param {String} locale
 * @param {Function} callback
 * @returns {*}
 */
function load(locale, callback) {
    locale = locale.toLowerCase();

    var envLoad = isServer ? serverLoad : clientLoad;
    envLoad(locale, callback);
}

module.exports = load;
