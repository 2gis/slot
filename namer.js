var _ = require('lodash');

// модификатор класса
var reClassMod = /^_([\-0-9a-zA-Z]+)(?:_(\S+))?$/;

/**
 * Готовит значение для сохранения в модификаторе класса.
 *
 * @param {*} value Может быть любым. Null, undefined, false и NaN вернут false, true вернет true,
 *                  число будет преобразовано в строку.
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
 * @param {string} value
 * @returns {number|string}
 */
function tryValueAsNumber(value) {
    var num = Number(value);
    return isNaN(num) ? value : num;
}

var namer = module.exports = {
    /**
     * Генерирует имя CSS-класса для модуля.
     *
     * @param {string} moduleName
     * @returns {string}
     */
    moduleClass: function(moduleName) {
        return moduleName;
    },

    /**
     * Генерирует имя CSS-класса для внутреннего элемента модуля.
     *
     * @param {string} moduleName
     * @param {string} elementName
     * @returns {string}
     */
    elementClass: function(moduleName, elementName) {
        return moduleName + '__' + elementName;
    },

    /**
     * Генерирует имя CSS-класса для модификатора класса.
     *
     * @param {string} name
     * @param {*} value
     * @returns {string}
     */
    modificatorClass: function(name, value) {
        value = prepareValueForClassMod(value);
        return value === false ? '' : '_' + name + (value === true ? '' : '_' + value);
    },

    /**
     * Вычисляет объект модификаторов класса.
     *
     * @param {string} className
     * @returns {Object}
     */
    getModificatorsFromClassName: function(className) {
        return _.reduce(
            className.match(/\S+/g) || [],
            function(mods, name) {
                if (reClassMod.test(name)) {
                    mods[RegExp.$1] = RegExp.$2 == '' ? true : tryValueAsNumber(RegExp.$2);
                }
                return mods;
            },
            {}
        );
    }
};
