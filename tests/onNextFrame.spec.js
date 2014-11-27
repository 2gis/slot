var assert = require('assert');
var sinon = require('sinon');

describe('onNextFrame', function() {
    var plugin = require('../plugins/onNextFrame');

    it('На сервере вызывает сразу', function() {
        global.window = {};
        var app = {
            isClient: false
        };
        var slot = {
            setTimeout: function(cb) {
                cb();
            }
        };
        var onNextFrame = plugin(app);

        var spy = sinon.spy();
        onNextFrame.call(slot, spy);

        assert(spy.calledOnce, 'Колбек должен быть вызван 1 раз на сервере');
    });

    it('На клиенте с нормальной реализацией requestAnimationFrame', function() {
        var timer = sinon.useFakeTimers();

        global.window = {
            requestAnimationFrame: function(cb) {
                setTimeout(cb, 100);
            }
        };

        var app = {
            isClient: true
        };
        var slot = {
            ifAlive: function(cb) {
                return cb;
            }
        };

        var onNextFrame = plugin(app);

        var spy = sinon.spy();
        onNextFrame.call(slot, spy);

        assert(!spy.called, 'Вызова до срабатывания requestAnimationFrame быть не должно');
        timer.tick(100);
        assert(spy.calledOnce, 'Колбек должен дернёться 1 раз после срабатывания requestAnimationFrame');

        timer.restore();
    });

    it('На клиенте с префиксной версией requestAnimationFrame', function() {
        var timer = sinon.useFakeTimers();

        global.window = {
            webkitRequestAnimationFrame: function(cb) {
                setTimeout(cb, 100);
            }
        };

        var app = {
            isClient: true
        };
        var slot = {
            ifAlive: function(cb) {
                return cb;
            }
        };

        var onNextFrame = plugin(app);

        var spy = sinon.spy();
        onNextFrame.call(slot, spy);

        assert(!spy.called, 'Вызова до срабатывания webkitRequestAnimationFrame быть не должно');
        timer.tick(100);
        assert(spy.calledOnce, 'Колбек должен дернёться 1 раз после срабатывания webkitRequestAnimationFrame');

        timer.restore();
    });

    it('На клиенте без requestAnimationFrame', function() {
        var timer = sinon.useFakeTimers();

        global.window = {};

        var app = {
            isClient: true
        };
        var slot = {
            ifAlive: function(cb) {
                return cb;
            },
            setTimeout: setTimeout
        };

        var onNextFrame = plugin(app);

        var spy = sinon.spy();
        onNextFrame.call(slot, spy);

        assert(!spy.called, 'Вызова до срабатывания setTimeout быть не должно');
        timer.tick(17);
        assert(spy.calledOnce, 'Колбек должен дернёться 1 раз после срабатывания setTimeout через 16.666 мс');

        timer.restore();
    });
});