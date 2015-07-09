/**
 * Сериализуют и десериализует данные в урлы и наоборот
 */

var _ = require('lodash');
var slashCode = '%2F';

/**
 * Экранирует урл
 * @param {string} x
 * @returns {string}
 */
function encodeUrlPart(x) {
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
 * Умно кодирует строку, не трогая закодированный слэш
 * moscow/search/пи,в%2Fо -> moscow/search/пи%2Cв%2Fо
 *
 * @param x
 * @returns {string}
 */
function encode(x) {
    if (x == null) throw new Error("null value for serialization");

    return _.map(x.split(slashCode), encodeUrlPart).join(slashCode);
}

/**
 * экранирует слэши
 * @param {string} x
 * @returns {string}
 */
function encodeSlashes(x) {
    if (x == null) throw new Error("null value for serialization");

    return String(x).replace(/\//g, slashCode);
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
    return str.replace(new RegExp(slashCode, 'g'), '/').replace(/\xA6/g, '/');
}

/**
 * Умно декодирует строку, не трогая декодированный слэш
 * moscow/search/пи%2Cв%2Fо -> moscow/search/пи,в%2Fо
 *
 * @param string
 * @returns {string}
 */
function decode(string) {
    return _.map(string.split('/'), function(part) {
        return replaceAll('/', slashCode, decodeURIComponent(part));
    }).join('/');
}

/**
 * @param {string} str
 * @returns {string}
 */
function decodeComponent(str) {
    return decodeSlashes(decodeURIComponent(str));
}

function replaceAll(search, replace, string) {
    return (string || '').split(search).join(replace);
}


exports.encode = encode;
exports.encodeComponent = encodeComponent;
exports.encodeSlashes = encodeSlashes;
exports.decode = decode;
exports.decodeComponent = decodeComponent;
exports.decodeSlashes = decodeSlashes;


