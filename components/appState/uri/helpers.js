
var _ = require('lodash');
var Pattern = require('./pattern');
var resolver = require('./resolver');
var parser = require('./parser');

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

/**
 * Transorm uri: take uri, parse it, create new uri
 * Use if you change uri format and support old and new formats
 *
 * @param uri - start uri
 * @param stateConf
 * @returns {string} - transformed uri
 */
exports.transform = function(uri, stateConf) {
    var slugEntries = parser.parse(stateConf.patterns, uri, [], stateConf.get('queryParamName'));
    var state = {};
    stateConf.invokeInjectors(slugEntries, state);

    // Поскольку в notParsed может быть всё, что угодно, то приведем его в порядок
    var cleanNotParsed = _.compact(slugEntries.notParsed.join('/').split('/')).join('/');
    var newUri = _.compact([cleanNotParsed, resolver(stateConf, state)]).join('/');
    if (newUri.charAt(0) != '/') {
        return '/' + newUri;
    }
    return newUri;
};

