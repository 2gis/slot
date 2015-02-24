
var Pattern = require('./pattern');

/**
 * Создает алиас для заданной комбинации части урла и параметров под неё
 * @param {String} uriPart
 * @param {Object} params
 * @param {String} alias
 * @returns {{pattern: Pattern, params: *, getUri: Function, alias: String}}
 */
exports.makeAlias = function(uriPart, params, alias) {
    var pattern = new Pattern(uriPart);

    return {
        pattern: pattern,
        params: params,
        getUri: function(encode) {
            return pattern.inject(params, encode);
        },
        alias: alias
    };
};

