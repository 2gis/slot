
var _ = require('lodash');
var stuff = require('../../lib/stuff');
var expandString = require('../../lib/expandString');
var Pattern = require('./uri/pattern');
var helpers = require('./uri/helpers');
var serializer = require('./uri/serializer');

var patternsCache;
var seoPatternsCache = {};

/**
 * адаптер для конфига, содержит методы которые, оперируя над конфигом, разрешают некоторые потребности стэйта
 * @param conf
 * @constructor
 */
function StateConf(conf) {
    this.conf = conf;
    this.patterns = this.compile();
    this.seoPatternsCache = this.conf.usePatternsCache ? seoPatternsCache : {};
}

/**
 * Получить свойство конфига по имени
 * @param {string} name
 * @returns {*}
 */
StateConf.prototype.get = function(name) {
    return this.conf[name];
};

/**
 * Ленивая функция возвращающая инвертированный conf.slugMapping
 * @returns {Object}
 */
StateConf.prototype.keyMapping = function() {
    if (!this._keyMapping) {
        this._keyMapping = _.invert(this.slugMapping());
    }
    return this._keyMapping;
};

/**
 * Ленивый аккессор до conf.slugMapping
 * @returns {Object}
 */
StateConf.prototype.slugMapping = function() {
    return this.conf.slugMapping || {};
};

/**
 * Возвращает соответствующее имя для стэйта на основе слага,
 * по умолчанию это всегда slug, если это не переопределено конфигом slugMapping
 *
 * Подробнее см. conf.slugMapping
 * @param {string} slug
 * @returns {string}
 */
StateConf.prototype.lookupStateKey = function(slug) {
    return this.slugMapping()[slug] || slug;
};

/**
 * Возвращает соответствующий слаг для заданного имени стэйта
 * @param {string} key
 * @returns {string}
 */
StateConf.prototype.lookupSlug = function(key) {
    return this.keyMapping()[key] || key;
};

/**
 * Компилируем паттерны урлов
 *
 * injector здесь это функция которая ответственна за то, как результат
 * метода Pattern#match записать в стэйт
 * @returns {Pattern[]}
 */
StateConf.prototype.compile = function() {
    if (this.conf.usePatternsCache && patternsCache) {
        return patternsCache;
    }

    var list = [],
        validatorsMap = this.conf.validatorsMap;

    _.each(this.conf.urls, function(injector, urlPattern) {
        _.each(expandString(urlPattern), function(finalPattern) {
            var pattern = new Pattern(finalPattern, validatorsMap);
            pattern.injector = injector;
            list.push(pattern);
        });
    });

    if (this.conf.usePatternsCache) {
        patternsCache = list;
    }

    return list;
};

/**
 * Правило сопоставления распарсенного ключа в стэйт
 * @param {SlugEntry} entry
 * @param {object} state
 * @returns {object}
 */
StateConf.prototype.inject = function(entry, state) {
    var stateKey = this.lookupStateKey(entry.slug);
    var value = state[stateKey] = entry.params;

    return [value, stateKey];
};

/**
 * Записывает в стэйт true без лишних параметров
 * @param {object} entry
 * @param {string} entry.slug
 * @param {object} state
 * @returns {object}
 */
StateConf.prototype.injectTrue = function(entry, state) {
    var stateKey = this.lookupStateKey(entry.slug);
    var value = state[stateKey] = true;

    return [value, stateKey];
};

/**
 * Реализует "плоское" представление entry.params
 * По сути мы берем params и добавляет туда stateKey в виде поля type
 * @param {Object} entry
 * @returns {Object}
 */
StateConf.prototype.flattenEntry = function(entry) {
    entry.params.type = this.lookupStateKey(entry.slug); // вроде как беспокоиться о неизменяемосте entry незачем ..
    return entry.params;
};

/**
 * Пропихивает entry в стэйт в массив под именем key
 * @param {string} key
 * @param {object} entry
 * @param {object} state
 * @returns {Array}
 */
StateConf.prototype.injectInArray = function(key, entry, state) {
    state[key] = state[key] || [];

    var value = this.flattenEntry(entry);
    state[key].push(value);

    return [value, key];
};

/**
 * Вызывает инжектор для заданного распарсенного кусочка урла
 * @param {object} entry
 * @param {object} state
 */
StateConf.prototype.invokeInjector = function(entry, state) {
    var injector = entry.injector;
    if (injector) {
        if (typeof injector == 'string') {
            entry.injector = this[injector];
        }

        if (typeof entry.injector != 'function') {
            throw new TypeError("Invalid injector for state:" + injector);
        }

        var valueKeyPair = entry.injector.call(this, entry, state);
        if (this.conf.onEntryInjected) {
            this.conf.onEntryInjected.call(this, valueKeyPair[0], valueKeyPair[1]);
        }
        return valueKeyPair;
    }
};

/**
 * Вызывает инжекторы для распарсенных кусочков урла
 * @param {object[]} entries
 * @param {object} state
 */
StateConf.prototype.invokeInjectors = function(entries, state) {
    var injectList = [];

    _.each(entries, function(entry) {
        var valueKeyPair = this.invokeInjector(entry, state);
        if (valueKeyPair) {
            injectList.push(valueKeyPair);
        }
    }, this);

    // пробегаемся второй раз и копируем значения внутри стэйта исходя из конфига stateRelations
    var stateRelations = this.conf.stateRelations;

    _.each(injectList, function(valueKeyPair) {
        var value = valueKeyPair[0];
        var key = valueKeyPair[1];

        var stateType = value.type || key;

        if (stateRelations && stateType in stateRelations) {
            var relations = stateRelations[stateType];

            _.each(relations, function(valuePath, key) {
                value[key] = stuff.getByPath(state, valuePath);
            });
        }
    });
};

/**
 * Ищет среди uri-паттернов тот, который подходит под заданный стэйт-тип и данные
 * @param {string} type
 * @param {object} data
 * @returns {Pattern|null}
 */
StateConf.prototype.resolvePattern = function(type, data) {
    var slug = this.lookupSlug(type);

    return _.find(this.patterns, function(pattern) {
        return pattern.slug == slug && pattern.dataMatch(data);
    });
};

/**
 * Ошибочка плохих параметров для пермалинка
 * @param {String} entity тип урла, выше есть список типов
 * @param {String[]} badParams те параметры, которые не прошли проверку
 * @param {String} pattern по какому паттерну хотели сделать урл
 * @param {Object} params параметры для формирования ссылки
 * @constructor
 */
function PermalinkNotFound(entity, params) {
    this.entity = entity;
    this.params = params;
    this.message = 'seoUrl [' + enity + '] does not match params ' + _.keys(params).join(',');
}

StateConf.PermalinkNotFound = StateConf.prototype.PermalinkNotFound = PermalinkNotFound;

/**
 * Получение нужной url с заполненными параметрами
 *
 * @param {string} type тип урла из кофига seoUrls
 * @param {object} params параметры для формирования урла
 * @param {string} [domain=''] что добавить перед строкой
 * @param {boolean} [strict=false] бросать ли исключение если ссылку не удалось сформировать
 * @throws {StateConf.PermalinkNotFound} бросается если ссылку не удалось сформировать из-за неподходящих параметров
 * @return {string} Вернет пустую строку если данного типа нет в конфиге seoUrls (или свалится с ошибкой, если strict)
 */
StateConf.prototype.permalink = function(type, params, domain, strict) {
    var pattern;

    var paramStoreKey;
    if (this.conf.usePatternsCache) {
        paramStoreKey = type + '_' +
            _.keys(params)
                .filter(function(key) {
                    return params[key] != null;
                })
                .sort()
                .join('-');

        pattern = this.seoPatternsCache[paramStoreKey];
    }

    params = _.defaults(params, this.conf.seoDefaults);

    if (!pattern) {
        var patterns = this.seoPatternsCache[type];
        if (!patterns) {
            var urlPattern = this.conf.seoUrls && this.conf.seoUrls[type];
            if (!urlPattern) {
                return null;
            }

            var validatorsMap = this.conf.validatorsMap;

            patterns = _.map(expandString(urlPattern), function(pattern) {
                return new Pattern(pattern, validatorsMap);
            });
            this.seoPatternsCache[type] = patterns;
        }

        pattern = _.find(patterns, function(pattern) {
            return pattern.dataMatch(params);
        });

        if (!pattern) {
            if (!strict) return '';
            throw new PermalinkNotFound(type, params);
        }

        if (this.conf.usePatternsCache) {
            this.seoPatternsCache[paramStoreKey] = pattern;
        }
    }

    var uri = pattern.inject(params, true);
    return (domain || '') + serializer.encode(uri);
};

module.exports = StateConf;
