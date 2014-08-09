/**
 * Утилиты для работы с массивами.
 */

/**
 * Преобразует массив в объект.
 *
 * @example
 * toDictionary(['one', 'two', 'tree'], true);// { one: true, two: true, tree: true }
 *
 * @example
 * toDictionary(['one', 'two', 'tree'], [1, 2, 3]);// { one: 1, two: 2, tree: 3 }
 *
 * @param {Array<string>} arr Массив, значения которого будут использованы как ключи объекта.
 * @param {Array|*} [values] Массив значений для объекта или одно значение, которое будет использовано для всех свойств.
 * @returns {Object}
 */
function toDictionary(arr, values) {
    var dict = Object.create(null);

    if (arr !== null) {
        arr.forEach(
            Array.isArray(values)
                ? function(key) { dict[key] = values.shift(); }
                : function(key) { dict[key] = values; }
        );
    }
    return dict;
}

exports.toDictionary = toDictionary;
