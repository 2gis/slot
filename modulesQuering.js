
var _ = require('lodash');

/**
 * Типы предикатов
 * @readonly
 * @enum {number}
 */
var predicateTypes = {
    MOD: 1, // online[active]
    ATOM: 2, // miniCard[:first]
    METHOD: 4 // searchBar[::valueIs(544)]
};

/**
 * Конструктор функции для дескрипторов модулей приложения
 *
 * @param {Array} moduleDescriptors дескрипторы модулей в приложении
 * @returns {queryModules} функция которая умеет запрашивать модули по селектору
 */
module.exports = function(moduleDescriptors) {

    /**
     * Фильтруем модули по уже распарсенному предикату
     *
     * @param {String} fromId с какого модуля фильтруем
     * @param {String} name тип модулей который нужен, если равен * то любой тип подходит
     * @param {Object} predicate распарсенный объект предиката, см. метод parsePredicate
     *
     * @returns {String[]} список отфильтрованных айдишников
     */
    function filterModules(fromId, name, predicate) {
        var currModuleDesc = moduleDescriptors[fromId],
            result = [];

        function matchType(type) {
            return name == '*' || name == type;
        }

        /**
         * Проверяет подходит ли предикат к заданному модулю
         *
         * @param {Object} moduleConf конфиг модуля
         * @param {Object} moduleDesc дескриптор модуля
         * @param {Number} index позиция модуля относительно родителя
         * @param {Array} all все родительские модули
         * @returns {boolean}
         */
        function matchPredicate(moduleConf, moduleDesc, index, all) {
            if (!predicate) return true;

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
                    case 'first':
                        return index == 0;
                    case 'last':
                        return index == all.length - 1;
                }
            }
        }

        /**
         * Рекурсивно накапливает в result модули которые удовлетворяют типу и предикату
         * @param {String} id модуль который будем тестировать, его дети рекурсивно тоже будут обработаны
         * @param {Number} index позиция модуля относительно родителя
         * @param {Array} all все родительские модули
         */
        function accumulate(id, index, all) {
            var moduleDesc = moduleDescriptors[id];

            if (matchType(moduleDesc.type) && matchPredicate(moduleDesc.moduleConf, moduleDesc, index, all)) {
                result.push(id);
            }

            _.each(moduleDesc.children, accumulate);
        }

        _.each(currModuleDesc.children, accumulate);

        return result;
    }

    /**
     * Возвращает дескрипторы модулей по заданному селектору
     *
     * @param {String} fromId рутовый модуль откуда начинаем выборку
     * @param {String} selector селектор запроса
     * @returns {Array}
     */
    function queryModules(fromId, selector) {
        var sel = selector.split(/\s+/);

        // элемент каскада
        var ruleRe = /([\w\*]+)(\[([^\]]+)\])?/;
        // один аргумент в конструкции [::foo(1, 'arg2', "arg3')]
        var argsRe = /(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^"'\s\,]+)+/g;
        // регулярка на все аргументы вместе со скобками, сами аргументы могут отсутствовать
        var argsGroupRe = /(\w+)\(([^\)]*)\)/;
        // триминг кавычек строчек
        var trimRe = /^['"]+|['"]+$/g;

        /**
         * Парсит предикат вида [:name(args)=ref] в соответствующую структуру
         *
         * Предикаты бывают трех типов:
         * 1. [active] предикат по модификатору, равен predicateTypes.MOD
         * 2. [:first] предикат по заранее определенному поведению, равен predicateTypes.ATOM
         * 3. [::isDone(4,6)] предикат по интерфейсному методу, метод должен вернуть true либо значение ref если он указан, равен predicateTypes.METHOD
         *
         * @param {String} str тело предиката
         * @returns {{name: String, ref: *, type: predicateTypes, args: Array}}
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
            var rule = ruleRe.exec(sel[i]);
            if (!rule) throw new Error("Invalid selector " + selector);

            var name = rule[1];
            var predicate = rule[3] && parsePredicate(rule[3]);

            var newIds = [];

            for (var k = 0, kLen = ids.length; k < kLen; k++) {
                var id = ids[k];
                newIds = newIds.concat(filterModules(id, name, predicate));
            }

            ids = newIds.slice();
            if (!ids.length) break;
        }

        return _.at(moduleDescriptors, ids);
    }

    return queryModules;
};
