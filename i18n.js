// @TODO: use gettext for this..

var env = require('./env');

var globals = env.globals();

/**
 * Склонение существительного по количественным группам
 *
 * @param {Number} number - число
 * @param {String} one - форма для 1-го
 * @param {String} two - форма для 2-х
 * @param {String} five - форма для 5-ти
 * @returns {String}
 */
function getNounDeclension(number, one, two, five) {
    number = Math.abs(number);
    number %= 100;
    if (number >= 5 && number <= 20) {
        return five;
    }
    number %= 10;
    if (number == 1) {
        return one;
    }
    if (number >= 2 && number <= 4) {
        return two;
    }
    return five;
}

/**
 * Склоняет и добавляет число в начало
 *
 * @param {Number} number - число
 * @param {String} one - форма для 1-го
 * @param {String} two - форма для 2-х
 * @param {String} five - форма для 5-ти
 * @returns {String}
 */
globals._t = exports._t = function(num, one, two, five) {
    return num + ' ' + getNounDeclension(num, one, two, five);
};

/**
 * Склоняет и возвращает без числа
 *
 * @param {Number} number - число
 * @param {String} one - форма для 1-го
 * @param {String} two - форма для 2-х
 * @param {String} five - форма для 5-ти
 * @returns {String}
 */
globals._tt = exports._tt = function(num, one, two, five) {
    return getNounDeclension(num, one, two, five);
};

globals._g = exports._g = function(str) { // Заглушка для переводов
    return str;
};

/**
 * Переводит первый символ строки в верхний регистр
 */
globals._gu = exports._gu = function(str) {
    //str = globals._g(str); // закомменчено, т.к. пока не надо
    return typeof str == "string" ? str.charAt(0).toUpperCase() + str.substr(1) : str;
};