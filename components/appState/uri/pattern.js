
var _ = require('lodash');
var stuff = require('../../../lib/stuff');
var SlugEntry = require('./slugEntry');

var paramReG = /:(\w+)/g,
    paramReN = /:(\w+)/;

var serializer = require('./serializer');

var compileCache = {};

/**
 * @returns {RegExp} Регесп для разбора готовой строки, но не паттерна!
 */
function compile(pattern) {
    var compiledPattern = compileCache[pattern];
    if (!compiledPattern) {
        var reStr = pattern.replace(/([.*+?^=!${}()|\[\]\\])/g, '\\$1');
        reStr = reStr.replace(paramReG, '([^\/]+)');
        compiledPattern = new RegExp(reStr)
        compileCache[pattern] = compiledPattern;
    }
    return compiledPattern;
}

/**
 * Класс реализует правило сопоставления заданного паттерна со строкой
 * @param {string} pattern паттер вида search/:pivo
 * @param {object} [validators] валидаторы для параметров
 * @constructor
 */
function Pattern(pattern, validators) {
    this.pattern = pattern;

    this.validators = validators;

    this.slug = pattern.split('/')[0];

    this.params = _.map(pattern.match(paramReG), function(param) {
        return param.slice(1);
    });

    this.patternRe = compile(pattern);
}

/**
 * Возвращает валидатор для заданного параметра
 *
 * @param {string} name
 * @returns {*}
 */
Pattern.prototype.validatorFor = function(name) {
    var slugSpecific = this.slug + '/' + name;

    return this.validators && (this.validators[slugSpecific] || this.validators[name]);
};

/**
 * Проверяем что заданный паттерн соответствует переданным данным
 * @param {object} data
 * @returns {Array|null} null - если все хорошо, иначе имена параметров которые не прошли проверку
 */
Pattern.prototype.checkData = function(data) {
    var errorKeys = [];

    _.each(this.params, function(name) {
        if (name in data) {
            var value = data[name];

            var validator = this.validatorFor(name);

            if (validator && validator.toUrl) {
                value = validator.toUrl(value);
            }

            if (validator && !validator(value)) {
                errorKeys.push(name);
            }
        } else {
            errorKeys.push(name); // key is missing
        }
    }, this);

    return errorKeys.length ? errorKeys : null;
};

/**
 * Проверяем что заданный паттерн соответствует переданным данным
 *
 * @param {object} data
 * @returns {boolean}
 */
Pattern.prototype.dataMatch = function(data) {
    return this.checkData(data) == null;
};

/**
 * Парсит переданную строку, извлекая из него слаг и параметры
 *
 * @param {string} str
 * @returns {SlugEntry?}
 */
Pattern.prototype.match = function(str) {
    var pattern = this.pattern;

    var slug = this.slug;
    var names = pattern.match(paramReG);

    var matched = str.match(this.patternRe);
    if (matched) {
        var params = {};

        for (var i = 1, len = matched.length; i < len; i++) {
            var name = names[i - 1].substr(1);

            var value = serializer.decodeSlashes(matched[i]);

            var validator = this.validatorFor(name);
            if (validator && !validator(value)) {
                return;
            }

            params[name] = value;
        }

        return new SlugEntry(slug, params).matchedFrom(matched[0], matched.index);
    }
};

/**
 * Инжектит данные в паттерн получая в итоге строку
 * @param {object} data данные для вставки
 * @param {boolean} [encode=true]
 * @returns {string}
 */
Pattern.prototype.inject = function(data, encode) {
    encode = encode == null ? true : encode;
    var self = this;

    return this.pattern.replace(paramReG, function(match, name) {
        var value = data[name] != null ? data[name] : '';
        var validator = self.validatorFor(name);

        if (validator && validator.toUrl) {
            value = validator.toUrl(value);
        }

        if (encode) {
            value = serializer.encodeComponent(value);
        }
        return value;
    });
};

module.exports = Pattern;
