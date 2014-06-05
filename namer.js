var _ = require('lodash');

function convertDashToCamel(dashedString) {
    return dashedString.toString().replace(/(-[a-zA-Z])/g, function($1) {
        return $1[1].toUpperCase(); // $1 это строка типа "-a", "-B", поэтому берем второй символ этой строки
    });
}
/**
 * Готовим значение модификатора для сохранения в класс
 * @param  {} typedValue может быть любым. Null, undefined, false и NaN вернут false, true вернет true, число будет преобразовано в строку
 * @return {Boolean|String} true - надо выставить класс без значения, false - класс не нужен, string - значение модификатора
 */
function convertTypeToValue(typedValue) {
    // boolean возвращаем без изменений
    if (_(typedValue).isBoolean()) {
        return typedValue;
    }

    // null, undefined и NaN становятся false
    if (typedValue == null || _(typedValue).isNaN()) {
        return false;
    }

    return typedValue.toString();
}

function convertValueToType(value) {
    value = value.toString();

    // Boolean не может прийти поэтому сразу пробуем преобразовать к числу
    // Number
    var convertedValue = parseFloat(value);
    if (convertedValue.toString() === value) {
        return convertedValue;
    }

    // Default
    return value;
}

var namer = module.exports = {

    // Генерирует имя CSS-класса для модуля
    moduleClass: function(moduleName) {
        return moduleName;
    },

    // Генерирует имя CSS-класса для модификатора модуля по неймингу BEVIS
    modificatorClass: function(name, value) {
        var cls = '';
        value = convertTypeToValue(value);

        if (name && value) {
            cls += '_' + name;

            // Если бы value булевое true, то значение выставлять не надо
            if (_(value).isString()) cls += '_' + value;
        }

        return cls;
    },

    /**
     * Класс может быть типа _key_value, или _key если имеет булевое знаечение true
     * Смотрим, что:
     * - класс начинается с _
     * - в классе содержится 1 или 2 повторения _([a-zA-Z\-]*)
     *
     * @param {string} className
     * @returns {boolean}
     */
    isClassAModificator: function(className) {
        var findUnderscores = /_([a-zA-Z0-9\-]*)/g,
            counter = 0,
            startsWithUnderscore = className.indexOf('_') == 0;
        while ( findUnderscores.exec(className) != null ) {
            counter++;
        }
        return startsWithUnderscore && counter >= 1 && counter <=2;
    },

    /**
     * Возвращает объект модификатора исходя из класса.
     * Берет слова (возможно, разделенные тире [a-zA-Z\-]) после подчеркивания, кемелкейсит их и возвращает объект.
     * Пример: '_full-width_true' => { "fullWidth": "true" }, '_full-width' => { "fullWidth": true }
     *
     * @param {string} className
     * @return {}
     */
    getModificatorFromClass: function(className) {
        if (!namer.isClassAModificator(className)) return {};

        var getModificator = /_([a-zA-Z0-9\-]*)/g,
            key, value,
            out = {},
            camelCasedClassName = convertDashToCamel(className);

        // Получаем ключ
        var key = getModificator.exec(camelCasedClassName)[1];
        // Получаем значение, которого может и не быть
        var valueMatch = getModificator.exec(camelCasedClassName);
        if (valueMatch === null || valueMatch[1] === "") {
            value = true;
        } else {
            value = convertValueToType(valueMatch[1]);
        }

        out[key] = value;

        return out;
    },

    /**
     * Возвращает имя элемента в бэм-представлении
     *
     * @moduleName {string} имя модуля
     * @elementName {string} имя элемента
     * @return {string} имя элемента
     */
    elementClass: function(moduleName, elementName) {
        return moduleName + '__' + elementName;
    }
};