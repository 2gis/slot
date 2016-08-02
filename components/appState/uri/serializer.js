/**
 * Сериализуют и десериализует данные в урлы и наоборот
 */
var _ = require('lodash');

var encodedSlash = '%2F';

module.exports = {
    encode: encode,

    encodeParts: encodeParts,
    decodeParts: decodeParts,

    encodeSlashes: encodeSlashes,
    decodeSlashes: decodeSlashes
};

/**
 * инкодит url
 * @param {string} x
 * @returns {string}
 */
function encode(x) {
    x = String(x);

    var queryIndex = x.indexOf('?');
    if (queryIndex == -1) {
        return x;
    }

    var pathname = x.slice(0, queryIndex);
    var search = x.slice(queryIndex + 1);
    return encodeParts(pathname) + '?' + encodeQueryParams(search);
}

/**
 * инкодит части между слешами
 * @param {string} x
 * @returns {string}
 */
function encodeParts(x) {
    return _.map(String(x).split('/'), function(part) {
        return _.map(part.split(encodedSlash), encodeURIComponent).join(encodedSlash);
    }).join('/');
}

/**
 * декодит части между слешами не трогая заинкоженные слеши
 * @param {string} x
 * @returns {string}
 */
function decodeParts(x) {
    return _.map(x.split(encodedSlash), decodeURIComponent).join(encodedSlash);
}

/**
 * инкодит query-парметры
 * @param {string} x
 * @returns {string}
 */
function encodeQueryParams(x) {
    return String(x).replace(/=([^&]+)/g, function(matched, value) {
        return '=' + encodeURIComponent(value);
    });
}

/**
 * инкодит слеши
 * @param {string} x
 * @returns {string}
 */
function encodeSlashes(x) {
    return String(x).replace(/\//g, encodedSlash);
}

/**
 * декодит слеши
 * @param {string} x
 * @returns {string}
 */
function decodeSlashes(x) {
    return String(x).replace(new RegExp(encodedSlash, 'g'), '/');
}
