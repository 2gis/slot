var assert = require('assert'),
    sinon = require('sinon');

describe('Core -> slot', function() {
    var moduleName = 'zoom',
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
});