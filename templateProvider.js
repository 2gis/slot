var _ = require('underscore');
var env = require('./env');
var stuff = require('./stuff');

/**
 * Возвращает хранилище шаблонов по нэймспэйcу
 *
 * Каждый нэймспэйс волен делать уровень вложенности по своему
 * @param {String} ns нэймспэйс шаблонов
 * @returns {*}
 */
function getStorage(ns) {
    ns = 'jst_' + ns;
    return env.isServer ? env.requirePrivate(ns)[ns] : window[ns];
}
exports.getStorage = getStorage;

function lazyWrap(tmplSpec, handlebars) {
    if (!tmplSpec.wrapped) {
        handlebars = handlebars || env.get('handlebars');
        tmplSpec.wrapped = handlebars.template(tmplSpec);
    }

    return tmplSpec.wrapped;
}
exports.lazyWrap = lazyWrap;

exports.wrapTemplateSpecs = function(templateSpecs, handlebars) {
    if (!templateSpecs) return {};

    if (!templateSpecs._wrapped) {
        _.each(templateSpecs, function(tmpl, name) {
            templateSpecs[name] = lazyWrap(tmpl, handlebars);
        });
        templateSpecs._wrapped = true;
    }

    return templateSpecs;
};

/**
 * Вовзращает все шаблоны для заданного модуля
 *
 * @param {String} moduleName
 * @returns {*}
 */
exports.forModule = function(moduleName) {
    var storage = getStorage('modules')[moduleName];
    return exports.wrapTemplateSpecs(storage)
};

/**
 * Возвращает шаблон в заданном нэймспэйсе по заданному пути
 * @param {String} ns в каком нэймспэйсе берем шаблон
 * @param {String} path путь разделенный точками
 * @returns {Function}
 */
exports.resolve = function(ns, path) {
    var templates = getStorage(ns);
    return lazyWrap(stuff.getByPath(templates, path));
};