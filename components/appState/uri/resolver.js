
var _ = require('lodash');
var serializer = require('./serializer');

/**
 * Возвращает строковое представление стэйта
 *
 * @param {StateConf} stateConf конфиг урлов приложения
 * @param {object} state состояние приложения в виде JSON
 * @param {string[]} [aliases] алиасы для стейтов
 * @returns {string} готовый url
 */
module.exports = function(stateConf, state, aliases) {
    aliases = aliases || [];

    function processState(data, name) {
        var pattern = stateConf.resolvePattern(name, data);

        if (!pattern) {
            return;
        }

        var uri = pattern.inject(data, true);
        _.some(aliases, function(entry) {
            if (!entry.alias) return;

            var entryUri = entry.getUri();
            if (uri == entryUri || uri.startsWith(entryUri + '/')) {
                uri = uri.replace(entryUri, serializer.encode(entry.alias));
                return true;
            }
        });

        return uri;
    }

    /**
     * Process part of state: make uri
     *
     * @param [array] stateKeys - array of state keys to resolve
     * @returns {string}
     */
    function processPart(stateKeys) {
        var parts = [];
        _.each(stateKeys, function(name) {
            var data = state[name];
            if (_.isArray(data)) {
                _.each(data, function(state) {
                    var type = state.type;
                    var data = _.omit(state, 'type');
                    parts.push(processState(data, type));
                });
            } else {
                parts.push(processState(data, name));
            }
        });
        return _.compact(parts).join('/');
    }

    var priorityList = stateConf.get('priorityList') || [];
    var stateKeys = _.keys(state);
    stateKeys.sort(function(a, b) {
        var indexA = _.indexOf(priorityList, a);
        var indexB = _.indexOf(priorityList, b);
        return indexA - indexB;
    });

    var queryParamsList = stateConf.get('queryParamsList') || [];
    var grouppedKeys = _.groupBy(stateKeys, function(stateKey) {
        return _.contains(queryParamsList, stateKey) ? 'query' : 'main';
    });

    var pathName = processPart(grouppedKeys.main);
    var queryPart = serializer.encodeSlashes(processPart(grouppedKeys.query));

    return pathName + (queryPart ? '?' + stateConf.get('queryParamName') + '=' + queryPart : '');
};
