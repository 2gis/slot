
var _ = require('lodash');

/**
 * Типы предикатов.
 *
 * @private
 *
 * @readonly
 * @enum {int}
 */
var predicateTypes = {
    MOD: 1, // online[active]
    ATOM: 2, // miniCard[:first]
    METHOD: 4 // searchBar[::valueIs(544)]
};

/**
 * Конструктор функции для дескрипторов модулей приложения.
 *
 * @constructs slot.ModulesQuering
 *
 * @param {Array} moduleDescriptors - Дескрипторы модулей в приложении.
 * @returns {Function} Функция `queryModules`, которая умеет запрашивать модули по селектору.
 */
module.exports = function(moduleDescriptors) {

    /**
     * Фильтруем модули по уже распарсенному предикату.
     *
     * @private
     *
     * @param {string} fromId - С какого модуля фильтруем.
     * @param {string} name - Тип модулей который нужен, если равен * то любой тип подходит.
     * @param {Object[]} predicates - Массив распарсенных объектов предикатов, см. метод parsePredicate.
     * @param {boolean} [inclusive=false] - Включать ли начальный модуль в выборку.
     *
     * @returns {Array<string>} Список отфильтрованных айдишников.
     */
    function filterModules(fromId, name, predicates, inclusive) {
        var currModuleDesc = moduleDescriptors[fromId],
            result = [];

        function matchType(type) {
            return name == '*' || name == type;
        }

        /**
         * Проверяет подходит ли предикат к заданному модулю.
         *
         * @private
         *
         * @param {Object} moduleConf - Конфиг модуля.
         * @param {Object} moduleDesc - Дескриптор модуля.
         * @param {int} index - Позиция модуля относительно родителя.
         * @param {Array} all - Все родительские модули.
         * @returns {boolean}
         */
        function matchPredicates(moduleConf, moduleDesc, index, all) {
            return _.every(predicates, function(predicate) {
                if (predicate.type & predicateTypes.METHOD) {
                    if (!moduleConf.interface || !_.isFunction(moduleConf.interface[predicate.name])) {
                        return false;
                    }
                    var ref = predicate.ref == null ? true : predicate.ref;


                    return moduleConf.interface[predicate.name].apply(moduleConf, predicate.args) == ref;
                } else if (predicate.type & predicateTypes.MOD) {
                    var mods = moduleDesc.slot.mod();
                    var value = mods[predicate.name];

                    if (!predicate.ref) {
                        return value === true;
                    } else if (predicate.ref == '*') {
                        return value != null && value != false;
                    } else {
                        return value == predicate.ref;
                    }
                } else if (predicate.type & predicateTypes.ATOM) {
                    switch (predicate.name) {
                        case 'first-child':
                            return index == 0;
                        case 'last-child':
                            return index == all.length - 1;
                        case 'first':
                        case 'last':
                            return true;
                    }
                }
            });
        }

        /**
         * Рекурсивно накапливает в `result` модули которые удовлетворяют типу и предикату.
         *
         * @private
         *
         * @param {string} id - Модуль который будем тестировать, его дети рекурсивно тоже будут обработаны.
         * @param {int} index - Позиция модуля относительно родителя.
         * @param {Array} all - Все родительские модули.
         */
        function accumulate(id, index, all) {
            var moduleDesc = moduleDescriptors[id];

            if (matchType(moduleDesc.type) && matchPredicates(moduleDesc.moduleConf, moduleDesc, index, all)) {
                result.push(id);
            }

            _.each(moduleDesc.children, accumulate);
        }

        if (inclusive) {
            accumulate(fromId, 0, []);
        } else {
            _.each(currModuleDesc.children, accumulate);
        }

        // если последний предикат — :first или :last, возвращаем первый или последний модуль из выборки
        var lastPredicate = _.last(predicates);
        if (result.length && lastPredicate && lastPredicate.type & predicateTypes.ATOM) {
            switch (lastPredicate.name) {
                case 'first':
                    return result.slice(0, 1);
                case 'last':
                    return result.slice(-1);
            }
        }
        return result;
    }

    /**
     * Возвращает дескрипторы модулей по заданному селектору.
     *
     * @memberof slot.ModulesQuering#
     *
     * @param {string} fromId - Рутовый модуль откуда начинаем выборку.
     * @param {string} selector - Селектор запроса.
     * @param {boolean} [inclusive=false] - Начинать ли выборку с рутового модуля.
     * @returns {Array<slot.Slot>}
     */
    function queryModules(fromId, selector, inclusive) {
        var sel = selector.split(/\s+/);

        // элемент каскада
        var ruleRe = /([\w\*]+)((?:\[[^\]]+\])*)/;
        // один аргумент в конструкции [::foo(1, 'arg2', "arg3')]
        var argsRe = /(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^"'\s\,]+)+/g;
        // регулярка на все аргументы вместе со скобками, сами аргументы могут отсутствовать
        var argsGroupRe = /(\w+)\(([^\)]*)\)/;
        // триминг кавычек строчек
        var trimRe = /^['"]+|['"]+$/g;

        /**
         * Парсит предикат вида [:name(args)=ref] в соответствующую структуру.
         *
         * Предикаты бывают трех типов:
         * 1. [active] предикат по модификатору, равен predicateTypes.MOD
         * 2. [:first] предикат по заранее определенному поведению, равен predicateTypes.ATOM
         * 3. [::isDone(4,6)] предикат по интерфейсному методу, метод должен вернуть true либо значение ref если он указан, равен predicateTypes.METHOD
         *
         * @private
         *
         * @param {string} str - Тело предиката.
         * @returns {{ name: string, ref: *, type: predicateTypes, args: Array }}
         */
        function parsePredicate(str) {
            var name = str,
                type = predicateTypes.MOD; // см predicateTypes

            if (str.charAt(0) == ':') {
                type = predicateTypes.ATOM;
                name = str.substr(1);
                if (str.charAt(1) == ':') {
                    type = predicateTypes.METHOD;
                    name = name.substr(1);
                }
            }

            var indexOfEq = name.indexOf('=');
            var reference = null; // то что стоит после равно

            if (indexOfEq != -1) {
                reference = name.substr(indexOfEq + 1);
                name = name.substr(0, indexOfEq);
            }

            var args = [],
                argGroupMatch = name.match(argsGroupRe);

            if ((type & predicateTypes.METHOD) && argGroupMatch) {
                name = argGroupMatch[1];
                args = argGroupMatch[2].match(argsRe) || [];
                args = args.map(function(s) {
                    return s.replace(trimRe, '');
                });
            }

            return {
                name: name,
                ref: reference,
                type: type,
                args: args
            };
        }

        var ids = [fromId];

        // итерация по элементам каскада, каждый раз выборка уточняется
        for (var i = 0, len = sel.length; i < len; i++) {
            // предикат
            var predRe = /\[([^\]]+?)\]/g;
            var rule = ruleRe.exec(sel[i]);

            if (!rule) {
                throw new Error("Invalid selector " + selector);
            }

            var name = rule[1];
            var predicatesString = rule[2];

            var predicates = [],
                predicateMatch;

            while (predicateMatch = predRe.exec(predicatesString)) {
                predicates.push(parsePredicate(predicateMatch[1]));
            }

            var newIds = [];

            for (var k = 0, kLen = ids.length; k < kLen; k++) {
                var id = ids[k];
                newIds = newIds.concat(filterModules(id, name, predicates, inclusive));
            }

            inclusive = false; // далее inclusive должен быть равен false для корректной выборки в каскаде

            ids = newIds.slice();

            if (!ids.length) {
                break;
            }
        }

        return _.at(moduleDescriptors, ids);
    }

    return queryModules;
};
