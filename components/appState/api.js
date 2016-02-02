
var _ = require('lodash');
var deepEqual = require('deep-equal');

function StateApi() {
    // накапливаемый стэйт приложения
    this.state = {};
}

/**
 * Сбрасываем все состояние на заданное
 * @param {Object} [newState]
 */
StateApi.prototype.assign = function(newState) {
    this.state = newState || {};
};

StateApi.prototype.clear = function() {
    this.assign(null, true);
};

StateApi.prototype.getState = function() {
    return this.state;
};

StateApi.prototype.defaults = function(newState) {
    return _.defaults(this.state, newState);
};

StateApi.prototype.get = function(name) {
    return this.state[name];
};

StateApi.prototype.del = function(name) {
    delete this.state[name];
};

StateApi.prototype.set = function(name, value) {
    this.state[name] = value;
};

StateApi.prototype.toggle = function(name, value) {
    if (value === void 0) {
        value = !this.state[name];
    }
    if (value) {
        this.set(name, value);
    } else {
        this.del(name);
    }
};

/**
 * Возвращает результат сравнения текущего состояния и эмулированного через clone
 * без учета каких-либо параметров
 *
 * @param {StateApi} api
 * @param {String[]} ignoreParams - список параметров стэйта, которые не будем учитывать
 * @returns {boolean}
 */
StateApi.prototype.isEqual = function(api, ignoreParams) {
    var actualUri = omitParams(this),
        expectedUri = omitParams(api);

    function omitParams(state) {
        return _.omit(state.getState(), ignoreParams);
    }
    return deepEqual(expectedUri, actualUri);
};

/**
 * @returns {object} Стэйт который будет учавствовать в формировании урла
 */
StateApi.prototype.getShareState = function() {
    return this.state;
};

module.exports = StateApi;
