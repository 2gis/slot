
var _ = require('lodash');
var serializer = require('./serializer');

/**
 * Возвращает строковое представление стэйта
 *
 * @param {StateConf} stateConf конфиг урлов приложения
 * @param {object} state состояние приложения в виде JSON
 * @param {string[]} [aliases] алиасы для стейтов
 * @param {boolean} [encode]
 * @returns {string} готовый url
 */
module.exports = function(stateConf, state, aliases, encode) {
    aliases = aliases || [];

    var parts = [];

    function processState(data, name) {
        var pattern = stateConf.resolvePattern(name, data);

        if (!pattern) {
            return;
        }

        var uri = pattern.inject(data, encode);

        _.some(aliases, function(entry) {
            if (!entry.alias) return;

            var entryUri = entry.getUri();
            if (uri == entryUri || uri.startsWith(entryUri + '/')) {
                uri = uri.replace(entryUri, serializer.encode(entry.alias));
                return true;
            }
        });

        parts.push(uri);
    }

    var priorityList = stateConf.get('priorityList') || [];
    var stateKeys = _.keys(state);
    stateKeys.sort(function(a, b) {
        var indexA = _.indexOf(priorityList, a);
        var indexB = _.indexOf(priorityList, b);
        return indexA - indexB;
    });

    _.each(stateKeys, function(name) {
        var data = state[name];

        if (_.isArray(data)) {
            _.each(data, function(state) {
                var type = state.type;
                var data = _.omit(state, 'type');
                processState(data, type);
            });
        } else {
            processState(data, name);
        }
    });

    return parts.join('/');
};