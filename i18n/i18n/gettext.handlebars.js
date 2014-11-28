var _ = require('lodash');
var partialString = req('lib/partialString');
var handlebars = require('handlebars');
var stringHelper = req('helpers/string');
var gettext = require('./gettext');

function isCapitalized(str) {
    return str.charAt(0).toUpperCase() == str.charAt(0);
}

function renderBlockHelper(p, opts) {
    var helper = handlebars.helpers[p.name];
    return helper(p.value, {hash: opts});
}

/**
 * Умный форматтер
 *
 * @param {string} text форматируемый текст
 * @param {object} opts опции для форматтера
 */
function format(text, opts) {
    var compiled = partialString(text);

    _.each(compiled.partials, function(p) {
        var name = p.prefix || p.name; // имя для партиала (префикс более приоритетный)
        var nameForOptions = stringHelper.uncapitalize(name);

        var partialOpts = opts[nameForOptions];

        // блок хелпер
        if (isCapitalized(p.name)) {
            compiled.replace(p, renderBlockHelper(p, partialOpts));
            // просто врапнутый текст
        } else {
            if (typeof partialOpts != 'function') throw new Error('Invalid resolver for i18n partial ' + name);
            compiled.replace(p, partialOpts(p.value));
        }
    });

    return compiled.toString();
}

/**
 * Прототип функции ht, не для прямого использования
 * @param {function} translator
 * @param {boolean} isPlural
 * @param {array} args
 * @param {object} formatterOpts
 * @returns {string}
 */
function ht(translator, isPlural, args, formatterOpts) {
    var translatorArgs = args.slice(0, translator.length);
    var translated = translator.apply(null, translatorArgs);

    var formatArgsOffset = translator.length - (isPlural ? 1 : 0);

    if (args.length > formatArgsOffset) {
        translated = stringHelper.format(translated, args.slice(formatArgsOffset));
    }

    return format(translated, formatterOpts);
}

/**
 * Враппер для хелперов
 * @param {function} translator
 * @param {boolean} isPlural
 * @returns {*}
 */
function htHelper(translator, isPlural) {
    var args = [].slice.call(arguments, 2);
    var options = args.pop();

    var opts = {};

    _.each(options.hash, function(value, name) {
        if (/\w+__/.test(name)) {
            var kk = name.split('__');
            var subOpts = opts[kk[0]] = opts[kk[0]] || {};

            subOpts[kk[1]] = value;
        } else {
            opts[name] = value;
        }
    });

    return ht(translator, isPlural, args, opts);
}

/**
 * Врапер для рантайма js
 * @param {function} translator
 * @param {boolean} isPlural
 * @returns {*}
 */
function htRuntime(translator, isPlural) {
    var args = [].slice.call(arguments, 2);
    var opts = args.pop();

    return ht(translator, isPlural, args, opts);
}

exports.htRuntime = htRuntime;
exports.htHelper = htHelper;
