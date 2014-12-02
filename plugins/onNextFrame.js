var _ = require('lodash');

/**
 * Обертка вокруг requestAnimationFrame и его альтернативы setTimeout
 * @param {Object} app
 */
module.exports = function(app) {
    var reqAnimFrame;

    // Ищем реализацию requestAnimationFrame
    if (app.isClient) {
        reqAnimFrame = window.requestAnimationFrame;

        var vendor = ['ms', 'moz', 'webkit', 'o'],
            i = 0;

        while (!reqAnimFrame && i < vendor.length) {
            reqAnimFrame = window[vendor[i++] + 'RequestAnimationFrame'];
        }
    }

    return function(callback) {
        if (!_.isFunction(callback)) throw new TypeError('[slot onNextFrame] callback must be a function');

        var slot = this; // Колбек должен убиваться при убийстве модуля, поэтому берём именно его слот

        if (reqAnimFrame) {
            reqAnimFrame(slot.ifAlive(callback));
        } else {
            slot.setTimeout(callback, 1000 / 60);
        }
    };
};
