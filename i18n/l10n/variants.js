
var _ = require('lodash');
var config = require('slot/config');

var locales = config['i18n.locales'];
var aliases = config['i18n.aliases'];

/**
 * Возвращает поддерживаемую локаль для заданной
 * @param {String} locale
 * @returns {String|null}
 */
exports.getSupportedLocale = function(locale) {
    if (_.contains(locales, locale)) return locale;
    if (aliases[locale]) return aliases[locale];

    var lang = locale.split('_')[0];
    if (lang.toLowerCase() == 'ru') {
        return 'ru_ru';
    }
};