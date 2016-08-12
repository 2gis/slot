
var _ = require('lodash');
var SlugEntry = require('./slugEntry');
var serializer = require('./serializer');

var paramReG = /:(\w+)/g;

var compileCache = {};

/**
 * @returns {RegExp} Регесп для разбора готовой строки, но не паттерна!
 */
function compile(pattern) {
    var compiledPattern = compileCache[pattern];
    if (!compiledPattern) {
        var reStr = _.escapeRegExp(pattern).replace(paramReG, '([^\/]+)');
        compiledPattern = new RegExp(reStr);
        compileCache[pattern] = compiledPattern;
    }
    return compiledPattern;
}

/**
 * @returns {string} возвращает слаг
 */
function getSlug(pattern) {
    var slashIndex = pattern.indexOf('/');
    if (slashIndex != -1) {
        return pattern.slice(0, slashIndex);
    }
    return pattern;
}

/**
 * Мапит валидаторы для заданного параметра
 *
 * @param {object} validators
 * @param {string} slug
 * @returns {object}
 */
function mapValidators(validators, slug) {
    if (!slug) {
        return validators || {};
    }

    return _.mapValues(validators, function(validator, name) {
        return validators[slug + '/' + name] || validators[name];
    });
}

/**
 * Класс реализует правило сопоставления заданного паттерна со строкой
 * @param {string} pattern паттер вида search/:pivo
 * @param {object} [validators] валидаторы для параметров
 * @constructor
 */
function Pattern(pattern, validators) {
    this.pattern = pattern;

    this.slug = getSlug(pattern);

    this.validators = mapValidators(validators, this.slug);

    this.patternRe = compile(pattern);

    this.params = _.map(pattern.match(paramReG), function(param) {
        return param.slice(1);
    });
}

/**
 * Проверяем что заданный паттерн соответствует переданным данным
 * @param {object} data
 * @returns {string|null} null - если все хорошо, иначе имена параметров которые не прошли проверку
 */
Pattern.prototype.checkData = function(data) {
    var validators = this.validators;
    return _.find(this.params, function(name) {
        var value = data[name];
        if (value === undefined) {
            return true;
        }

        var validator = validators[name];
        if (validator) {
            if (validator.toUrl) {
                value = validator.toUrl(value);
            }

            if (!validator(value)) {
                return true;
            }
        }
    });
};

/**
 * Проверяем что заданный паттерн соответствует переданным данным
 *
 * @param {object} data
 * @returns {boolean}
 */
Pattern.prototype.dataMatch = function(data) {
    return !this.checkData(data);
};

/**
 * Парсит переданную строку, извлекая из него слаг и параметры
 *
 * @param {string} str
 * @returns {SlugEntry?}
 */
Pattern.prototype.match = function(str) {
    var matched = str.match(this.patternRe);
    if (!matched) {
        return;
    }

    var names = this.params;
    var params = {};

    for (var i = 1, len = matched.length; i < len; i++) {
        var name = names[i - 1];
        var value = serializer.decodeSlashes(matched[i]);

        var validator = this.validators[name];
        if (validator && !validator(value)) {
            return;
        }

        params[name] = value;
    }

    return new SlugEntry(this.slug, params).matchedFrom(matched[0], matched.index);
};

/**
 * Инжектит данные в паттерн получая в итоге строку
 * @param {object} data данные для вставки
 * @returns {string}
 */
Pattern.prototype.inject = function(data, encode) {
    var validators = this.validators;
    return this.pattern.replace(paramReG, function(match, name) {
        var value = data[name] != null ? data[name] : '';

        var validator = validators[name];
        if (validator && validator.toUrl) {
            value = validator.toUrl(value);
        }

        return encode ? serializer.encodeSlashes(value) : value;
    });
};

module.exports = Pattern;
