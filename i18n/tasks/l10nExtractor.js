var _ = require('lodash');
var Cldr = require('cldrjs');
var defaultSettings = req('l10n/country/settings.js');
var ZSchema = require('z-schema');
var schemaChecker = new ZSchema();
var schema = req('l10n/country/settings.schema.js');


function tryLoadResource(paths) {
    paths = paths || [];

    var path = _.first(paths);

    if (path) {
        try {
            if (path.substr(0, 2) == './') {
                // локальный путь
                return require(path);
            } else {
                // путь от корня проекта
                return req(path);
            }
        } catch (e) {
            // убираем первый путь и пробуем еще раз
            paths.shift();
            return tryLoadResource(paths);
        }
    }
    return {};
}

/**
 * Отдает форматы для заданной локали
 * @param {String} lang
 * @param {String} countryCode
 * @returns {Object}
 */
function getFormats(lang, countryCode) {
    countryCode = countryCode.toUpperCase();

    var locale = lang + '_' + countryCode;

    // Загружаем необходимые данные в cldr
    _.each([
        'supplemental/likelySubtags',
        'supplemental/currencyData',
        'main/' + lang + '/numbers',
        'main/' + lang + '/delimiters',
        'main/' + lang + '/currencies'
    ], function(path) {
        Cldr.load(req('l10n/cldr/json/' + path + '.json'));
    });

    var cldr = new Cldr(locale);

    var decimalFormat = cldr.main('numbers/decimalFormats-numberSystem-latn/standard') || '';
    var decimalDivider = cldr.main('numbers/symbols-numberSystem-latn/decimal');

    var currencies = cldr.get('supplemental/currencyData/region/' + countryCode);
    var currency = currencies && _.last(currencies) || {};
    var currencyId = _.first(_.keys(currency)) || '';
    var currencySymbol = cldr.main('numbers/currencies/' + currencyId).symbol;
    var currencyFormat = cldr.main('numbers/currencyFormats-numberSystem-latn/standard') || '';
    var currencyFormatShort = currencyFormat;

    // Обрезаем денежный формат, делаем дробную часть опциональной
    var currencyDecimalMatch = (new RegExp('[' + decimalDivider + ']0*')).exec(currencyFormat);
    if (currencyDecimalMatch[0]) {
        var currencyOptionalPart = decimalDivider;
        for (var i = 0; i < currencyDecimalMatch[0].length - 1; i++) {
            currencyOptionalPart += '#';
        }
        currencyFormatShort = currencyFormatShort.replace(currencyDecimalMatch[0], currencyOptionalPart);
    }

    var defaultStrings = {
        quotationStart: '«',
        quotationEnd: '»'
    };
    var strings = _.pick(cldr.main('delimiters') || defaultStrings, 'quotationStart', 'quotationEnd');

    // Форматы по-умолчанию
    var formats = {
        time: {
            'weekFirstDayOffset': 1, // Moment.js Monday
            'short': 'HH:mm',
            'is12h': false,
            'dashboard': 'HH:mm, D MMMM, dddd'
        },
        currency: {
            id: currencyId,
            symbol: currencySymbol,
            standard: currencyFormat,
            short: currencyFormatShort
        },
        number: {
            standard: decimalFormat,
            short: decimalFormat
        },
        address: {
            order: 'straight'
        },
        string: strings
    };

    // подгружаем заданные руками форматы для локали
    var customLocaleFormats = tryLoadResource(['l10n/' + locale + '/formats.js', 'l10n/' + lang + '/formats.js']);

    // подгружаем заданные руками форматы для страны
    var customCountryFormats = tryLoadResource(['l10n/country/' + countryCode.toLowerCase() + '/formats.js']);

    // подгружаем локальный конфиг форматов
    var localFormats = tryLoadResource(['l10n/formats.local.js']);

    for (var key in formats) {
        formats[key] = _.extend({}, formats[key], customLocaleFormats[key], customCountryFormats[key], localFormats[key]);
    }

    return formats;
}

function checkDefaultSettingsSchema() {
    var result = schemaChecker.validate(defaultSettings, schema);
    if (!result) {
        throw new Error('Default settings are not compatible with JSON schema. ' +
            'Fix settings file, or update schema.\n' + JSON.stringify(schemaChecker.getLastErrors(), undefined, 4));
    }
}

var checkDefaultSettingsSchemaOnce = _.once(checkDefaultSettingsSchema);

/**
 * Настройки для проекта от страны - показывать ли в дашборде пипку X
 * @param {String} countryCode код страны
 * @returns {Object}
 */
function getSettings(countryCode) {
    checkDefaultSettingsSchemaOnce();

    countryCode = countryCode.toLowerCase();

    var customCountrySettings = tryLoadResource(['l10n/country/' + countryCode + '/settings.js']);

    // подгружаем локальный конфиг настроек
    var localSettings = tryLoadResource(['l10n/settings.local.js']);

    // Массивы при мерже берем целиком, остальное мержим по значению
    var result = _.merge({}, defaultSettings, customCountrySettings, localSettings, function(a, b) {
        return _.isArray(b) ? b : undefined;
    });

    if (schemaChecker.validate(result, schema)) {
        return result;
    } else {
        throw new Error('Settings for locale ' + countryCode + ' are not compatible with JSON schema. ' +
            'Fix settings file, or update schema.\n' + JSON.stringify(schemaChecker.getLastErrors(), undefined, 4));
    }
}

exports.getSettings = getSettings;
exports.getFormats = getFormats;
