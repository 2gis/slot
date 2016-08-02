

var _ = require('lodash');

var optionalRe = /\[([^\]]+)\]/;

function replaceMatch(str, match, value) {
    return str.slice(0, match.index) + value + str.slice(match.index + match[0].length);
}

function expandFirst(str) {
    var match = str.match(optionalRe);
    if (!match) {
        return [str];
    } else {
        return [
            replaceMatch(str, match, match[1]),
            replaceMatch(str, match, '')
        ];
    }
}

function doExpand(str) {
    var parts = expandFirst(str);
    if (parts.length > 1) {
        return _.flatten(_.map(parts, doExpand));
    } else {
        return parts;
    }
}

/**
 * Превращает строку вида foo/[:id], в массив ['foo', 'foo/:id']
 * @param str
 * @returns {String[]}
 */
module.exports = doExpand;
