
var _ = require('lodash');
var serializer = require('./serializer');

/**
 * Применяем доводчик fromUrl валидаторов для распарсеного кусочка урла
 * @param entry
 */
function finishParse(entry) {
    _.each(entry.params, function(value, name) {
        var validator = entry.pattern.validatorFor(name);
        if (validator && validator.fromUrl) {
            entry.params[name] = validator.fromUrl(value);
        }
    });
}


/**
 * Создает логическую единицу кусочка распарсенной строки для парсера
 * @param {string} str
 * @param {SlugEntry} entry
 * @returns {{str: *, parsed: boolean, entry: *}}
 */
function mkParsed(str, entry) {
    return {
        str: str,
        parsed: true,
        entry: entry
    };
}

/**
 * Создает логическую единицу кусочка нераспарсенной строки для парсера
 * @param {string} str
 * @returns {{str: *}}
 */
function mkPart(str) {
    return {str: str};
}

/**
 * Функция-тест на распарсенность куска
 * @param {object} part
 * @returns {boolean}
 */
function imNotParsed(part) {
    return !part.parsed;
}

/**
 * Возвращает только нераспарсенные куски из списка
 * @param {object[]} parts
 * @returns {*}
 */
function getCleanParts(parts) {
    return _.filter(parts, imNotParsed);
}

/**
 * Помечает все нераспарсенные куски и возвращает их
 * @param {object[]} parts
 * @returns {Array}
 */
function markDirty(parts) {
    var notParsedParts = [];
    _.each(parts, function(part) {
        if (!part.parsed) {
            notParsedParts.push(part.str);
            part.parsed = true;
            part.dirty = true;
        }
    });
    return notParsedParts;
}

/**
 * Парсит строку в специальную структуру, описанную ниже
 * @param {Pattern[]} patterns
 * @param {String} str
 * @param {Array} [aliases]
 * @returns {Array} разобранная строка в виде массива, каждый элемент которой объект следующего вида:
 *     {string} slug
 *     {object} params разобранные параметры
 *     {number} index где нашли в строке заданный кусок
 *     {Pattern} [pattern] связанный pattern с помощью которого был разобран данный кусок урла
 */
exports.parse = function(patterns, str, aliases) {
    str = serializer.decode(str);

    var parts = str ? [mkPart(str)] : [];

    function doParse() {
        var someParsed,
            slashRe = /^\/+$/;

        do {
            var cleanParts = getCleanParts(parts);
            // проходимся по всем паттернам
            someParsed = _.some(patterns, function(pattern) {
                // а теперь для заданного паттерна проходимся по всему урлу (нераспарсенному)
                return _.some(cleanParts, function(part) {
                    var partIndex = _.indexOf(parts, part);

                    var matched = pattern.match(part.str);
                    if (matched) {
                        matched.pattern = pattern;
                        finishParse(matched);
                        matched.injector = pattern.injector;

                        // сплитим parts
                        var partLeft = part.str.substring(0, matched.index);
                        var partRight = part.str.substr(matched.index + matched.string.length);
                        if (slashRe.test(partLeft)) partLeft = '';
                        if (slashRe.test(partRight)) partRight = '';

                        var spliceArgs = [partIndex, 1];
                        if (partLeft) {
                            spliceArgs.push(mkPart(partLeft));
                        }
                        spliceArgs.push(mkParsed(matched.string, matched));
                        if (partRight) {
                            spliceArgs.push(mkPart(partRight));
                        }
                        [].splice.apply(parts, spliceArgs);

                        return true;
                    }
                });
            });
        } while (someParsed);
    }

    /**
     * Разобъем нераспарсенные куски по слэшу
     * @param {Array} cleanParts
     */
    function splitCleanParts(cleanParts) {
        var allParts = [];

        _.each(cleanParts, function(part) {
            var partStr = part.str,
                partIndex = _.indexOf(parts, part);

            if (partStr.indexOf('/') != -1) {
                var newParts = _.map(_.compact(partStr.split('/')), mkPart);
                allParts.push.apply(allParts, newParts);

                var spliceArgs = [partIndex, 1].concat(newParts);
                parts.splice.apply(parts, spliceArgs);
            } else {
                allParts.push(part);
            }
        });

        return allParts;
    }

    /**
     * Заменяем алиасы на паттерны про которые знает парсер
     * @returns {boolean}
     */
    function processAliases() {
        var someProcessed = false;

        var cleanParts = getCleanParts(parts);
        if (cleanParts.length && aliases) {
            cleanParts = splitCleanParts(cleanParts);

            _.each(aliases, function(entry) {
                _.each(cleanParts, function(part) {
                    var partStr = part.str;
                    var partIndex = _.indexOf(parts, part);

                    // кусочек урла должен строго соответствовать алиасу
                    if (partStr == entry.alias) {
                        someProcessed = true;
                        parts[partIndex] = mkPart(entry.getUri(false));
                    }
                });
            });
        }

        return someProcessed;
    }

    doParse();

    if (processAliases()) {
        doParse();
    }

    var notParsed = markDirty(parts),
        entries = [];

    _.each(parts, function(part) {
        if (part.entry) {
            entries.push(part.entry);
        }
    });

    entries.notParsed = notParsed;

    return entries;
};
