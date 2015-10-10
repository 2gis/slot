/**
 * Библиотека для измерения fps
 *
 */
module.exports = function(app) {
    var last,
        distrib,
        status,
        fpsCap = 100; // max fps to measure

    function getRaf() {
        if (!app.isClient) return;

        return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        null;
    }

    /**
     * Принимает массив и возвращает его же, только чтоб сумма элементов равнялась 1 \
     * (каждый элемент умножается на некую одинаковую для всех константу)
     *
     * @param {Array} arr
     * @returns {Array}
     */
    function normalize(arr) {
        var sum = 0;

        arr.splice(fpsCap);

        for (var i = 0 ; i < fpsCap ; i++) {
            arr[i] = typeof arr[i] != 'undefined' ? arr[i] : 0; // extending undefined elements
            sum += arr[i];
        }

        if (sum != 0) {
            for (i = 0 ; i < fpsCap ; i++) {
                arr[i] = arr[i] / sum;
            }
        }

        return arr;
    }

    /**
     * Хендлер события requestAnimationFrame.
     * Вычисляет fps из времени последнего срабатывания и добавляет ему стат. вес
     *
     * @param time
     */
    function tick(time) { // ms
        var delta;

        if (last) {
            delta = time - last;
        }

        if (delta > 0) {
            var fps = Math.round(1000 / delta);

            distrib[fps] = (distrib[fps] || 0) + delta;
        }

        last = time;

        if (status == 'inProgress') {
            getRaf()(tick);
        }
    }

    var fpsMeter = {
        /**
         * Начало изменения
         */
        start: function() {
            if (!app.isClient) return;

            if (!getRaf()) return;
            distrib = [];
            status = 'inProgress';
            tick(); // will invoke itself while status != 'ended'
        },

        /**
         * Завершить измерения и вернуть результат
         *
         * @param percentile
         * @returns {number}
         */
        end: function(percentile) {
            if (!app.isClient) return;

            var norm = [],
                sum = 0;

            if (!getRaf()) return;

            percentile = percentile || 0.5;
            status = 'ended';
            norm = normalize(distrib);

            for (var i = norm.length - 1 ; i > 0 ; i--) {
                sum += norm[i];

                if (sum > percentile) break;
            }

            return i;
        }
    };

    return fpsMeter;
};
