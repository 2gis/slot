var _ = require('underscore');

function convertCamelToDash(camelCasedString) {
    return camelCasedString.toString().replace(/([A-Z])/g, function($1) {
        return "-" + $1.toLowerCase();
    });
}

function convertDashToCamel(dashedString) {
    return dashedString.toString().replace(/(-[a-zA-Z])/g, function($1) {
        return $1[1].toUpperCase(); // $1 это строка типа "-a", "-B", поэтому берем второй символ этой строки
    });
}

var namer = module.exports = {

    // Конвертирует кэмел-кейс строку в строку с тирэ
    convertCamelToDash: convertCamelToDash,

    // Генерирует имя CSS-класса для модуля
    moduleClass: function(moduleName) {
        var camelCaseModules = req('helpers/camelCaseModules');

        if (!_.contains(camelCaseModules, moduleName)) {
            moduleName = convertCamelToDash(moduleName);
        }

        return moduleName;
    },

    // Генерирует имя CSS-класса для модификатора модуля
    // @TODO удалить метод
    moduleModificatorClassTemp: function(moduleName, modificatorName, modificatorValue) {
        if (modificatorValue === null || modificatorValue === undefined) {
            return '';
        }

        return (
            namer.moduleClass(moduleName) + '_' +
            convertCamelToDash(modificatorName) + '_' +
            convertCamelToDash(modificatorValue)
        );
    },

    // Генерирует имя CSS-класса для модификатора модуля по неймингу BEVIS
    moduleModificatorClass: function(name, value) {
        var cls = '';

        if ((value || value === 0) && value !== 'false') {
            cls += '_' + name;

            if (value != 'true' && value !== true) cls += '_' + value;
        }

        return cls;
    },

    /**
     * Модификатор начинается на подчеркивание и:
     * 1. Если значение null или false - то у модификатора используется только ключ ( '_disabled' )
     * 2. В остальных случаях модификатор включает и ключ и значение через подчеркивание ( '_color_green' )
     *
     * @param {jQuery} element
     * @param {string} modificatorName
     * @param {number|string|boolean|null} modificatorValue
     * @returns {string|null}   Если вернуть null, то все равно можно скормить в jQuery.addClass,
     *                          т.к. там проверка на тип входящего значения 'string'
     */
    elementModificatorClass: function(modificatorName, modificatorValue) {
        // Имя modificatorName должно быть truthy
        if (!modificatorName || modificatorValue === undefined) {
            return null;
        }

        // убираем модификатор в случае если значение null или false
        if (modificatorValue === null || modificatorValue === false) {
            return '';
        }

        // модификатор начинается на подчеркивание
        var modClass = '_' + modificatorName;
        // опускаем значение в случае модификатора со значением true
        if (modificatorValue !== true) {
            modClass += '_' + modificatorValue;
        }

        return modClass;
    },

    /**
     * Смотрим, что:
     * - класс начинается на название модуля
     * - после него идет подчеркивание
     * - всего класс содержит два подчеркивания: online_full_true
     *
     * @param {string} moduleName
     * @param {string} className
     * @returns {boolean}
     */
    isClassAModificator: function(moduleName, className) {
        var findUnderscores = /_/g,
            counter = 0,
            moduleClass = namer.moduleClass(moduleName),
            indexOfModuleClass = className.indexOf(moduleClass);
        while ( findUnderscores.exec(className) != null ) {
            counter++;
        }
        return indexOfModuleClass == 0 && className[moduleClass.length] == '_' && counter == 2;
    },

    /**
     * Возвращает объект модификатора исходя из класса.
     * Берет слова (возможно, разделенные тире [a-zA-Z\-]) после подчеркивания, кемелкейсит их и возвращает объект.
     * Пример: 'online_full-width_true' => { "fullWidth": "true" }
     * (!) Применять только после isClassAModificator.
     *
     * @param {string} className
     * @return {}
     */
    getModificatorFromClass: function(className) {
        var getModificator = /_([a-zA-Z\-]*)/g,
            modificator = [],
            out = {},
            continuePlease = true,
            camelCasedClassName;
        while (continuePlease) {
            camelCasedClassName = convertDashToCamel(className);
            modificator.push(getModificator.exec(camelCasedClassName)[1]); // exec возвращает массив вида [pattern, match, index, input]

            if (modificator.length == 2) {
                continuePlease = false;
            }
        }

        out[modificator[0]] = modificator[1];
        return out;
    },

    /**
     * Возвращает имя элемента в бэм-представлении
     *
     * @moduleName {string} имя модуля
     * @elementName {string} имя элемента
     * @dashed {bool} преобразует имя элемента в дашед-кейс (для обратной совместимости)
     * @return {string} имя элемента
     */
    elementClass: function(moduleName, elementName, dashed) {
        if (dashed) {
            elementName = convertCamelToDash(elementName);
            moduleName = namer.moduleClass(moduleName);
        }

        return moduleName + '__' + elementName;
    }
};