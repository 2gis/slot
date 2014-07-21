
var _ = require('lodash');

/**
 * Функция сортировки которая двигает транзишены коллаута в конец
 * @param a транзишен
 * @param b транзишен
 * @returns {number}
 */
function moveCalloutToEnd(a, b) {
    if (a.purpose != b.purpose) {
        if (a.purpose == 'callout') return 1;
        if (b.purpose == 'callout') return -1;
    }

    return 0;
}

/**
 * Сортируем транзишены перед исполнением
 * @param transitions
 */
exports.sort = function(transitions) {
    // если есть транзишен коллаута и карты, двигаем тразишен коллаута за карту
    if (_.find(transitions, {purpose: 'map'})) {
        transitions.sort(moveCalloutToEnd);
    }
};
