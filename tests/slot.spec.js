
var assert = require('assert');

describe('Core -> slot', function() {
    var slot;

    before(function() {
        var testEnv = require('./testEnv')();

        slot = testEnv.slot;

        testEnv.app.loadModule = function(conf) {
            return {
                id: function() {
                    return conf.moduleId;
                },
                type: conf.type,
                slot: slot,
                init: function(data, cb) {
                    cb();
                }
            };
        };
    });

    it('#init с параметрами (type, callback)', function(cb) {
        assert(slot.init, 'slot имеет метод init');

        slot.init('foo', function(err, module) {
            assert(!err);
            assert(module);
            assert.equal(module.type, 'foo');

            cb();
        });
    });

    it('#init с параметрами (type, data, callback)', function(cb) {
        slot.init('foo', {}, function(err, module) {
            assert(!err);
            assert(module);
            assert.equal(module.type, 'foo');

            cb();
        });
    });

    it('#init с параметрами (moduleConf, callback)', function(cb) {
        slot.init({type: 'foo', data: {}}, function(err, module) {
            assert(!err);
            assert(module);
            assert.equal(module.type, 'foo');

            cb();
        });
    });

    /*

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

    describe('ifAlive', function() {
        it('ifAlive регистрирует функцию и в живом модуле вызывает именно её', function() {
            var result = false,
                fn = function() {
                    result = true;
                };

            var toCall = slot.ifAlive(fn);
            toCall();

            assert(result, 'Функция так и не была вызвана');
        });

        it('ifAlive регистрирует функцию и в мёртвом модуле её не вызывает', function() {
            var result = true,
                fn = function() {
                    result = false;
                };

            var toCall = slot.ifAlive(fn);
            slot.dispose();
            toCall();

            assert(result, 'Функция была вызвана после slot.dispose');
        });

        it('ifAlive регистрирует функцию после смерти модуля и её не вызывает', function() {
            var result = true,
                fn = function() {
                    result = false;
                };

            slot.dispose();
            var toCall = slot.ifAlive(fn);
            toCall();

            assert(result, 'Функция была вызвана после slot.dispose');
        });
    });

    */
});
