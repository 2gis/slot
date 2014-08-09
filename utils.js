/**
 * Общие утилиты.
 */

var uidCounter = 0;

/**
 * @returns {int}
 */
function nextUID() {
    return ++uidCounter;
}

exports.nextUID = nextUID;
