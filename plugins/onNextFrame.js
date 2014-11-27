/**
 * Обертка вокруг requestAnimationFrame и его алтернативы setTimeout
 * @param {Object} slot
 */
module.exports = function(slot) {
    var reqAnimFrame;

    // Ищем реализацию requestAnimationFrame
    if (slot.isClient) {
        reqAnimFrame = window.requestAnimationFrame;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var vendorIndex = 0; vendorIndex < vendors.length && !reqAnimFrame; ++vendorIndex) {
            reqAnimFrame = window[vendors[vendorIndex] + 'RequestAnimationFrame'];
        }
    }

    slot.onNextFrame = function(callback) {
        callback = callback || function() {};
        if (slot.isClient && reqAnimFrame) {
            reqAnimFrame(callback);
        } else {
            slot.setTimeout(callback, 1000 / 60);
        }
    };
};
