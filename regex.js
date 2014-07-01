/**
 * Утилиты для работы с регулярками.
 */

/**
 * Экранирует спецсимволы регулярного выражения.
 *
 * @param {string} re
 * @returns {string}
 */
function escape(re) {
    return re.replace(/([?![+\-\.]^|{}(=:)$\/\\*])/g, '\\$1');
}

exports.escape = escape;
