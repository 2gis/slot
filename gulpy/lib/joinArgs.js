/**
 * Преобразует JSON-like аргументы в Shell-like аргументы
 * @param opts
 * @returns {Array}
 */
function joinArgs(opts) {
    var line = [];

    function makeOpt(key, value) {
        var prefix = key.length > 1 ? '--' : '-';
        var sep = prefix == '--' ? '=' : ' ';

        if (value === true) value = '';
        if (value === false) return '';

        if (/\s+/.test(value)) {
            value = '"' + value + '"';
        }

        if (value) {
            value = sep + value;
        }

        return prefix + key + value;
    }

    for (var key in opts) {
        var value = opts[key];
        if (Array.isArray(value)) {
            var p = value.map(function(v) {
                return makeOpt(key, v);
            }).join(' ');

            line.push(p);
        } else {
            line.push(makeOpt(key, value));
        }
    }

    return line;
}

module.exports = joinArgs;