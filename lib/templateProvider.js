/**
 * @module templateProvider
 */

var _ = require('lodash');
var env = require('../env');
var stuff = require('./stuff');

/**
 * Возвращает хранилище шаблонов по нэймспэйcу.
 * Каждый нэймспэйс волен делать уровень вложенности по своему.
 *
 * @memberof module:templateProvider
 *
 * @param {string} ns - Нэймспэйс шаблонов.
 * @returns {*}
 */
function getStorage(ns) {
    ns = 'jst_' + ns;
    if (env.isServer) {
        try {
            return env.requirePrivate(ns)[ns];
        } catch (ex) {
            if (ex.code == 'MODULE_NOT_FOUND') {
                // pass
                return {};
            }
            throw ex;
        }
    } else {
        return window[ns] || {};
    }
}

exports.getStorage = getStorage;

var templateSpecNextId = 0;

/**
 * @param {object} templateSpecs
 * @param {Handlebars} [handlebars]
 * @returns {*}
 */
function compileTemplates(templateSpecs, handlebars) {
    if (!templateSpecs) {
        return {};
    }

    handlebars = handlebars || env.get('handlebars');

    handlebars._compiledTemplates = handlebars._compiledTemplates || {};
    var id = templateSpecs.id = templateSpecs.id || templateSpecNextId++;

    if (!(id in handlebars._compiledTemplates)) {
        var templates = {};

        _.each(templateSpecs, function(spec, name) {
            templates[name] = handlebars.template(spec);
        });

        handlebars._compiledTemplates[id] = templates;
    }

    return handlebars._compiledTemplates[id];
}

exports.compileTemplates = compileTemplates;

/**
 * Вовзращает все шаблоны для заданного модуля.
 *
 * @param {string} moduleName
 * @param {Handlebars} [handlebars]
 * @returns {*}
 */
exports.forModule = function(moduleName, handlebars) {
    var storage = getStorage('modules')[moduleName];
    return compileTemplates(storage, handlebars);
};

/**
 * Возвращает шаблон в заданном нэймспэйсе по заданному пути.
 *
 * @param {string} ns в каком нэймспэйсе берем шаблон
 * @param {string} path путь разделенный точками
 * @param {Handlebars} [handlebars]
 * @returns {Function}
 */
exports.resolve = function(ns, path, handlebars) {
    handlebars = handlebars || env.get('handlebars');
    handlebars._compiledTemplates = handlebars._compiledTemplates || {};

    var cacheKey = ns + path;
    if (!(cacheKey in handlebars._compiledTemplates)) {
        var templates = getStorage(ns);
        var spec = stuff.getByPath(templates, path);

        handlebars._compiledTemplates[cacheKey] = handlebars.template(spec);
    }

    return handlebars._compiledTemplates[cacheKey];
};
