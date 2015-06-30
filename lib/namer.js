/**
 * @module namer
 *
 * @description
 * Реализация правил нейминга.
 * Сейчас возможно использовать только ru-версию БЭМа, приправленного BEViS синтаксисом для модификаторов.
 * Если это не подходит, используйте поле selector в элементах, и не используйте модификаторы элементов.
 */

var _ = require('lodash');

// модификатор класса
var reClassMod = /^_([\-0-9a-zA-Z]+)(?:_(\S+))?$/;
var be = '__';
var mm = '_';

// класс элемента модуля
var reElementClass = new RegExp('^([\-0-9a-zA-Z]+)' + be + '([\-0-9a-zA-Z]+)');

/**
 * Готовит значение для сохранения в модификаторе класса.
 *
 * @param {*} value - Может быть любым. Null, undefined, false и NaN вернут false, true вернет true,
 *                    число будет преобразовано в строку.
 * @returns {boolean|string} true - надо выставить класс без значения, false - класс не нужен,
 *                           string - значение модификатора.
 */
function prepareValueForClassMod(value) {
    // boolean возвращается без изменений
    if (typeof value == 'boolean') {
        return value;
    }

    // null, undefined и NaN становятся false
    if (value == null || _(value).isNaN()) {
        return false;
    }

    return value.toString();
}

/**
 * Пробует перевести строку в число.
 * В случае успеха возвращает полученное число, иначе - исходную строку.
 *
 * @param {string} str - Строка для преобразования.
 * @returns {number|string}
 */
function tryStringAsNumber(value) {
    var num = Number(value);
    return isNaN(num) ? value : num;
}

/**
 * Генерирует имя CSS-класса для корневого элемента модуля.
 *
 * @param {string} moduleName - Имя модуля.
 * @returns {string} Имя CSS-класса для корневого элемента модуля.
 */
exports.moduleClass = function(moduleName) {
    return moduleName;
};

/**
 * Генерирует имя CSS-класса для внутреннего элемента модуля.
 *
 * @param {string} moduleName - Имя модуля.
 * @param {string} elementName - Имя элемента.
 * @returns {string} Имя CSS-класса для внутреннего элемента модуля.
 */
exports.elementClass = function(moduleName, elementName) {
    return moduleName + be + elementName;
};

/**
 * Генерирует имя CSS-класса для модификатора класса.
 *
 * @param {string} name - Имя модификатора.
 * @param {*} value - Значение модификатора.
 * @returns {string} Имя CSS-класса для модификатора класса.
 */
exports.modificatorClass = function(name, value) {
    if (!_.isString(name) || name.length == 0) {
        throw new Error('Name must be a non-empty string');
    }

    value = prepareValueForClassMod(value);

    if (value === false) {
        return '';
    } else {
        return mm + name + (value === true ? '' : mm + value);
    }
};

/**
 * Вычисляет модулю и элемент по имени класса
 *
 * @param {string|array} classList -  Содержимое html-атрибута class либо массив строк-классов.
 * @returns {object|undefined} - объект вида: {module: '', element: ''}
 */
exports.parseElementClass = function(classList) {
    if (_.isString(classList)) {
        classList = classList.match(/\S+/g) || [];
    }

    var matches = [];
    _.any(classList, function(oneClass) {
        matches = reElementClass.exec(oneClass);
        return !!matches;
    });
    if (!_.isEmpty(matches)) {
        return {
            block: matches[1],
            element: matches[2]
        };
    }
};

/**
 * Вычисляет объект модификаторов блока из списка классов на нём.
 *
 * @param {string|Array} classList - Содержимое html-атрибута class либо массив строк-классов.
 * @returns {Object} Объект всех понятых модификаторов.
 */
exports.parseMods = function(classList) {
    if (_.isString(classList)) {
        classList = classList.match(/\S+/g) || [];
    }

    return _.reduce(
        classList,
        function(mods, name) {
            if (reClassMod.test(name)) {
                mods[RegExp.$1] = RegExp.$2 == '' ? true : tryStringAsNumber(RegExp.$2);
            }
            return mods;
        },
        {}
    );
};

/**
 * Метод, обратный `parseMods`.
 *
 * @param {Object} mods - Объект модификаторов.
 * @returns {Array} *Массив* классов, восстановленных из модификаторов.
 */
exports.stringifyMods = function(mods) {
    if (!_.isObject(mods)) throw new TypeError('Mods must be an Object');

    var classes = [];

    _.each(mods, function(val, key) {
        var modClass = exports.modificatorClass(key, val);
        classes.push(modClass);
    });

    return _.compact(classes);
};
