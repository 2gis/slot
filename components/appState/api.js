
var _ = require('lodash');
var deepEqual = require('deep-equal');

function StateApi() {
    // накапливаемый стэйт приложения
    this.state = {};
    // сохраняет изменения замещенные неявными, временными значениями
    this.implicitChanges = {};

    /**
     * implicitSet наследует поведение toggle но при этом,
     * этот toggle не должен изменять implicitChanges,
     * для этого вводим флажок.
     * @type {boolean}
     */
    this.implicitChangesLocked = false;
}

/**
 * Сбрасываем все состояние на заданное
 * @param {Object} [newState]
 * @param {Boolean} [runFinalizer=false]
 */
StateApi.prototype.assign = function(newState, runFinalizer) {
    this.state = newState || {};
    if (runFinalizer) {
        this.applyFinalizer();
    }
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
    // да, это медленнее чем присвоение в undefined, но позволяет держать стэйт в чистоте не оставляя
    // мусорных ключей
    if (!this.implicitChangesLocked) delete this.implicitChanges[name];

    delete this.state[name];
};

StateApi.prototype.set = function(name, value) {
    if (!this.implicitChangesLocked) delete this.implicitChanges[name];

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
 * Ставим неявное, временное значение,
 * запоминаем постоянное в implicitChanges
 * @param {String} name
 * @param {*} value
 */
StateApi.prototype.implicitSet = function(name, value) {
    this.implicitChanges[name] = this.state[name];
    this.implicitChangesLocked = true;
    this.toggle(name, value);
    this.implicitChangesLocked = false;
};

/**
 * Восстанавливаем постоянное значение из implicitChanges
 * @param {String} name
 */
StateApi.prototype.implicitRestore = function(name) {
    var value = this.implicitChanges[name];
    if (value === undefined) {
        delete this.state[name];
    } else {
        this.state[name] = this.implicitChanges[name];
    }
    delete this.implicitChanges[name];
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

/**
 * Задает метод которым будет служить доводчиком состояния
 * @param {function} func функция с интерфейсом (state, diff)
 */
StateApi.prototype.setFinalizer = function(func) {
    this.finalizer = func;
};

/**
 * Применяет финализатор стэйта, если задан
 * @param {Object?} diff
 */
StateApi.prototype.applyFinalizer = function(diff) {
    if (this.finalizer) {
        this.finalizer(this, diff);
    }
    return this;
};

module.exports = StateApi;
