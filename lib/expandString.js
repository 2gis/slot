

var _ = require('lodash');

var optionalRe = /\[([^\]]+)\]/;

function stripSlashes(str) {
    return str.replace(/\/+$/, '').replace(/^\/+/, '');
}

function joinParts(parts) {
    return _.chain(parts)
        .map(stripSlashes)
        .compact()
        .value()
        .join('/');
}

function replaceMatch(str, match, value) {
    return joinParts([str.substring(0, match.index), value, str.substr(match.index + match[0].length)]);
}

/**
 * Превращает строку вида foo/[:id], в массив ['foo', 'foo/:id']
 * @param str
 * @returns {String[]}
 */
function expand(str) {
    var prefix = str.charAt(0) == '/' ? '/' : '';

    function expandFirst(str) {
        var match = str.match(optionalRe);
        if (!match) {
            return [str];
        } else {
            return [
                prefix + replaceMatch(str, match, match[1]),
                prefix + replaceMatch(str, match, '')
            ];
        }
    }

    function doExpand(str) {
        var parts = expandFirst(str);
        if (parts.length > 1) {
            return _.flatten(_.map(parts, doExpand), true);
        } else {
            return parts;
        }
    }

    return doExpand(str);
}

module.exports = expand;
