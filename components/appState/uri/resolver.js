var _ = require('lodash');
var serializer = require('./serializer');

module.exports = {
    resolveUrl: resolveUrl,
    resolvePath: resolvePath,
    resolveQuery: resolveQuery
};

/**
 * Возвращает строковое представление стэйта
 *
 * @param {StateConf} stateConf конфиг урлов приложения
 * @param {object} state состояние приложения в виде JSON
 * @param {string[]} [aliases] алиасы для стейтов
 * @returns {string} готовый url
 */
function resolveUrl(stateConf, state, aliases) {
    var pathname = resolvePath(stateConf, state, aliases);
    var search = resolveQuery(stateConf, state, aliases);
    search = search ? '?' + stateConf.get('queryParamName') + '=' + encodeURIComponent(search) : '';
    return pathname + search;
}

function resolvePath(stateConf, state, aliases) {
    var queryParamsList = stateConf.get('queryParamsList') || [];
    var stateKeys = _.keys(state).filter(function(key) {
        return !_.contains(queryParamsList, key);
    });

    sortStateKeys(stateConf, stateKeys);

    return serializer.encodeParts(processParts(stateConf, state, stateKeys, aliases));
}

function resolveQuery(stateConf, state, aliases) {
    var queryParamsList = stateConf.get('queryParamsList') || [];
    var stateKeys = _.keys(state).filter(function(key) {
        return _.contains(queryParamsList, key);
    });

    sortStateKeys(stateConf, stateKeys);

    return processParts(stateConf, state, stateKeys, aliases);
}

function sortStateKeys(stateConf, stateKeys) {
    var priorityList = stateConf.get('priorityList') || [];
    stateKeys.sort(function(a, b) {
        var indexA = _.indexOf(priorityList, a);
        var indexB = _.indexOf(priorityList, b);
        return indexA - indexB;
    });
}

/**
 * Process part of state: make uri
 *
 * @param [array] stateKeys - array of state keys to resolve
 * @returns {string}
 */
function processParts(stateConf, state, stateKeys, aliases) {
    var parts = [];
    _.each(stateKeys, function(name) {
        var data = state[name];
        if (_.isArray(data)) {
            _.each(data, function(state) {
                var type = state.type;
                var data = _.omit(state, 'type');
                parts.push(processState(stateConf, data, type, aliases));
            });
        } else {
            parts.push(processState(stateConf, data, name, aliases));
        }
    });
    return _.compact(parts).join('/');
}

function processState(stateConf, data, name, aliases) {
    var pattern = stateConf.resolvePattern(name, data);
    if (!pattern) {
        return;
    }

    var uri = pattern.inject(data, true);
    _.some(aliases, function(entry) {
        if (!entry.alias) return;

        var entryUri = entry.getUri();
        if (uri == entryUri || uri.startsWith(entryUri + '/')) {
            uri = uri.replace(entryUri, entry.alias);
            return true;
        }
    });

    return uri;
}
