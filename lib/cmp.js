

var _ = require('lodash');
var eq = require('deep-equal');

/**
 * Сравнивает два хэш-объекта
 *
 * @param {object} a первый хэш-объект
 * @param {object} b второй хэш-объект
 * @param {function} fn sig:(key, aValue, bValue) метод который определяет результат итогового дифф-объекта
 * @returns {object}
 */
function dictsDiff(a, b, fn) {
    var diff = {};
    for (var key in a) {
        if (!a.hasOwnProperty(key)) continue;

        var value = a[key];
        var old = b[key];
        var res = fn(key, value, old);
        if (res[0]) {
            diff[key] = res[1];
        }
    }
    return diff;
}

/**
 * Сравнивает два хэш-объекта
 * @param old
 * @param newest
 * @param [comparator]
 * @returns {Object} Измененные значения передает как есть, утерянные передает как null, неизмененные не возвращает
 */
function cmpDicts(old, newest, comparator) {
    comparator = comparator || eq;

    var diff = dictsDiff(newest, old, function(key, newValue, oldValue) {
        return [!comparator(newValue, oldValue, key), newValue];
    });
    var lost = dictsDiff(old, newest, function(key, oldValue, newValue) {
        return [newValue === undefined, null];
    });
    return _.extend(diff, lost);
}

function cmpStateEntries(stateA, stateB) {
    return eq(stateA, stateB);
}

/**
 * Сравнивает два массива
 * @param {Array} old
 * @param {Array} newest
 * @returns {object} Возвращает объект вида
 *      .isEqual - равны ли массивы
 *      .added - часть массива которая была добавлена к старому
 *      .removed - часть массива которая была удалена из старого
 */
function cmpArrays(old, newest) {
    var result = {};

    var oldLen = old.length,
        newLen = newest.length,
        maxLen = Math.max(oldLen, newLen);

    var added = [],
        removed = [];

    for (var i = 0; i < maxLen; i++) {
        var oldVal = old[i];
        var newVal = newest[i];

        var entriesAreEqual = cmpStateEntries(oldVal, newVal);

        if (!entriesAreEqual) {
            if (i < newLen) added.push(newVal);
            if (i < oldLen) removed.push(oldVal);
        }
    }

    if (added.length) result.added = added;
    if (removed.length) result.removed = removed;

    result.isEqual = !added.length && !removed.length;
    result.value = newest;

    return result;
}

function cmpStates(state, newState) {
    var comparator = function(newVal, oldVal) {
        if (_.isArray(newVal) && _.isArray(oldVal)) {
            return cmpArrays(oldVal, newVal).isEqual;
        }
        return eq(newVal, oldVal);
    };

    var diff = cmpDicts(state, newState, comparator);
    _.each(diff, function(value, key, diff) {
        if (_.isArray(value)) {
            var currentVal = state[key] || [];
            diff[key] = cmpArrays(currentVal, value);
        }
    });

    return diff;
}

exports.dicts = cmpDicts;
exports.arrays = cmpArrays;
exports.states = cmpStates;
