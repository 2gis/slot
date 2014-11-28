
var _ = require('lodash');
var format = req('helpers/string').format;
var arraySlice = Array.prototype.slice;
var Gettext = require('./gettext');
var gettextHb = require('./gettext.handlebars');
var env = require('slot/env');
var load = require('./load');
var defaults = require('./defaults');
var variants = req('l10n/variants');
var moment = require('moment');

module.exports = function(app) {
    var lang;
    var countryCode = 'RU';
    var gettext;
    var locale;
    var formats = {};
    var settings = {};
    var publicRubricNames = {};
    var i18n = {};
    var config = require('slot/config');
    var inited = false;

    if (I18N_DEBUG) {
        var debugGlue = '$';
        var debugWrapper = function(str) {
            return debugGlue + str + debugGlue;
        };
    }

    i18n.init = function(langArg, countryCodeArg, callback) {
        if (arguments.length == 0) {
            langArg = countryCodeArg = 'ru';
        }

        var proposedLocale = langArg + '_' + countryCodeArg;
        locale = variants.getSupportedLocale(proposedLocale);
        if (!locale) {
            locale = 'ru_ru';   // @TODO: log about it ?
        }

        var localePair = locale.split('_');
        lang = localePair[0];

        countryCode = localePair[1];

        load(locale, function(localeData) {
            var data = localeData || defaults;

            settings = data[0];
            formats = data[1];

            gettext = new Gettext({
                locale_data: data[2]
            });
            moment.locale(lang);

            inited = true;

            if (callback) {
                callback();
            }
        });
    };

    i18n.inited = function() {
        return inited;
    };

    function russianPluralForm(n) {
        return n%10 == 1 && n%100 != 11 ? 0 : n%10 >= 2 && n%10 <= 4 && (n%100 < 10 || n%100 >= 20) ? 1 : 2;
    }

    function formatify(translator, shiftForFormatArgs) {
        shiftForFormatArgs = shiftForFormatArgs || 0;
        return function() {
            var formatArgs = arraySlice.call(arguments, translator.length + shiftForFormatArgs);
            var trArgs = arraySlice.call(arguments, 0, translator.length);

            return format(translator.apply(this, trArgs), formatArgs);
        };
    }

    // Заглушка для строк, которые пока не нужно включать в словарь перевода
    function _gg(str) {
        return _npgg(null, str);
    }

    i18n._gg = formatify(_gg);

    function _ngg(str, plural1, plural2, number) {
        return _npgg(null, str, plural1, plural2, number);
    }

    i18n._ngg = formatify(_ngg, -1);

    function _pgg(context, str) {
        return _npgg(context, str);
    }

    i18n._pgg = formatify(_pgg);

    function _npgg(context, str, plural1, plural2, number) {
        var translation = '';
        if (plural1 && plural2 && typeof(number) !== undefined) {
            var pluralGroup = russianPluralForm(number);
            translation = arguments[pluralGroup + 1];
        } else {
            translation = str;
        }
        return translation;
    }

    i18n._npgg = formatify(_npgg, -1);

    // Настоящие функции
    function _t(str) {
        return _npt(null, str);
    }

    i18n._t = formatify(_t);

    function _nt(str, plural1, plural2, number) {
        return _npt(null, str, plural1, plural2, number);
    }

    i18n._nt = formatify(_nt, -1);

    function _pt(context, str) {
        return _npt(context, str);
    }

    i18n._pt = formatify(_pt);

    function _npt(context, str, plural1, plural2, number) {
        var translation = '';
        if (gettext && gettext.isInited()) {
            translation = gettext.npgettext(context, str, plural2, number);
        }

        // Фолбэк, если нет словаря
        if (!translation) {
            translation = _npgg(context, str, plural1, plural2, number);
        }
        if (I18N_DEBUG) {
            translation = debugWrapper(translation);
        }

        return translation;
    }

    i18n._npt = formatify(_npt, -1);

    i18n._gg = formatify(_gg);

    i18n._quote = function(string) {
        if (!string) return '';
        return formats.string.quotationStart + (string.fn && string.fn(this) || string) + formats.string.quotationEnd;
    };

    i18n._htHelper = _.partial(gettextHb.htHelper, _t, false);
    i18n._hntHelper = _.partial(gettextHb.htHelper, _nt, true);

    i18n._ht = _.partial(gettextHb.htRuntime, _t, false);
    i18n._hnt = _.partial(gettextHb.htRuntime, _nt, true);

    i18n._hggHelper = _.partial(gettextHb.htHelper, _gg, false);
    i18n._hnggHelper = _.partial(gettextHb.htHelper, _ngg, false);

    i18n._hgg = _.partial(gettextHb.htRuntime, _gg, false);
    i18n._hngg = _.partial(gettextHb.htRuntime, _ngg, true);

    i18n.getLang = function() {
        return lang;
    };

    i18n.getLocale = function() {
        return locale;
    };

    i18n.getFormats = function() {
        return formats;
    };

    i18n.getSettings = function() {
        return settings;
    };

    /**
     * Народные названия рубрик для страны
     * @returns {Object}
     */
    i18n.getPublicRubricNames = function() {
        function tryLoad(file) {
            try {
                return req(file);
            } catch (e) {
                return {};
            }
        }

        return _.extend({},
            tryLoad('l10n/' + lang + '/publicRubricNames.js'),
            tryLoad('l10n/' + locale + '/publicRubricNames.js'),
            tryLoad('l10n/country/' + countryCode + '/publicRubricNames.js')
        );
    };

    i18n.getMessages = function() {
        return gettext && gettext.locale_data || {};
    };

    // Принимает ключ конфига на объект ссылок, возвращает нужную ссылку для текущей локали
    i18n._config = function(key, code) {
        return config[key] && (config[key][code] || config[key][countryCode] || config[key]['ru']) || '';
    };

    // @TODO if TEST
    i18n.mock = function(options) {
        options = options || {};
        countryCode = (options.countryCode || countryCode || 'ru').toLowerCase();
        config = options.config || config;

        gettext = new Gettext({
            locale_data: null // для русского переводы не нужны
        });
    };

    return i18n;
};
