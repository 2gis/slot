/**
 * Сериализуют и десериализует данные в урлы и наоборот
 */

var _ = require('lodash');

/**
 * Экранирует урл
 * @param {string} x
 * @returns {string}
 */
function encode(x) {
    if (x == null) throw new Error("null value for serialization");

    // encodeURI не трогает ~!@#$&*()=:/,;?+'
    return encodeURI(x)
        .replace(/[@*?#,]/g, function(s) {
            return encodeURIComponent(s);
        })
        .replace(/['()]/g, function(s) {
            return escape(s);
        });
}

/**
 * экранирует слэши
 * @param {string} x
 * @returns {string}
 */
function encodeSlashes(x) {
    if (x == null) throw new Error("null value for serialization");

    return String(x).replace(/\//g, '\xA6');
}

/**
 * экранирует компонент урла
 * @param {string} x
 * @returns {string}
 */
function encodeComponent(x) {
    if (x == null) throw new Error("null value for serialization");

    return encode(encodeSlashes(x));
}

/**
 * @param {string} str
 * @returns {string}
 */
function decodeSlashes(str) {
    return str.replace(/\xA6/g, '/');
}

/**
 * @param {string} str
 * @returns {string}
 */
function decode(str) {
    return decodeURIComponent(str);
}

/**
 * @param {string} str
 * @returns {string}
 */
function decodeComponent(str) {
    return decodeSlashes(decode(str));
}


exports.encode = encode;
exports.encodeComponent = encodeComponent;
exports.encodeSlashes = encodeSlashes;
exports.decode = decode;
exports.decodeComponent = decodeComponent;
exports.decodeSlashes = decodeSlashes;


