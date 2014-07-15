var assert = require('assert')/*,
    sinon = require('sinon')*/;

describe('Core -> slot', function() {
    /*var moduleName = 'zoom',
        testEnv = require('../../testEnv')(),
        module = testEnv.app.loadModule({type: 'zoom'}), //dataViewerModule(slot);
        slot = module.slot;

    it('blank', function() {

        assert(slot);
    });

    it('setTimeout на клиенте возвращает id таймаута для возможности его отмены', function() {
        var saveIsClient = testEnv.app.isClient;
        var saveIsServer = testEnv.app.isServer;

        testEnv.app.isServer = false;
        testEnv.app.isClient = true;

        var timer = slot.setTimeout(function() {}, 1);

        assert(timer);

        testEnv.app.isServer = saveIsServer;
        testEnv.app.isClient = saveIsClient;
    });

    it('setTimeout устанавливает таймаут и выполняет callback', function() {
        var saveIsClient = testEnv.app.isClient;
        var saveIsServer = testEnv.app.isServer;

        testEnv.app.isServer = false;
        testEnv.app.isClient = true;

        var clock = sinon.useFakeTimers(),
            test = sinon.spy(),
            timer = slot.setTimeout(test, 100);

        assert(!test.called);
        clock.tick(100);
        assert(test.calledOnce);

        clock.restore();
        testEnv.app.isServer = saveIsServer;
        testEnv.app.isClient = saveIsClient;
    });

    it('clearTimeouts отменяет все установленные через слот таймауты', function() {
        var saveIsClient = testEnv.app.isClient;
        var saveIsServer = testEnv.app.isServer;

        testEnv.app.isServer = false;
        testEnv.app.isClient = true;

        var clock = sinon.useFakeTimers(),
            test = sinon.spy(),
            timer = slot.setTimeout(test, 100);

        slot.clearTimeouts();
        clock.tick(100);

        assert(!test.called);

        clock.restore();
        testEnv.app.isServer = saveIsServer;
        testEnv.app.isClient = saveIsClient;
    });

    describe('regFn', function() {
        it('regFn регистрирует функцию и в живом модуле вызывает именно её', function() {
            var result = false,
                fn = function() {
                    result = true;
                };

            var toCall = slot.regFn(fn);
            toCall();

            assert(result, 'Функция так и не была вызвана');
        });

        it('regFn регистрирует функцию и в мёртвом модуле её не вызывает', function() {
            var result = true,
                fn = function() {
                    result = false;
                };

            var toCall = slot.regFn(fn);
            slot.dispose();
            toCall();

            assert(result, 'Функция была вызвана после slot.dispose');
        });

        it('regFn регистрирует функцию после смерти модуля и её не вызывает', function() {
            var result = true,
                fn = function() {
                    result = false;
                };

            slot.dispose();
            var toCall = slot.regFn(fn);
            toCall();

            assert(result, 'Функция была вызвана после slot.dispose');
        });
    });*/
});