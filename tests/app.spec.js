var assert = require('assert');
var sinon = require('sinon');
var _ = require('lodash');

DEBUG = true;

describe('app', function() {
    var app,
        appConfig;

    beforeEach(function() {
        app = require('../app.js')();
        appConfig = app.appConfig;
    });

    it('blank', function() {
        assert(app);
    });

    describe('-> resolveEntryPoint', function() {
        it('Не падает когда devPages нет в конфиге', function(done) {
            appConfig.config = {};
            appConfig.loadModule = function() {};

            appConfig.resolveEntryPoint();
            done();
        });
    });

    describe.skip('-> getModificators', function() {
        var mods;
        var appInstance;
        var moduleWrapper;

        before(function() {
            appInstance = app().instance;
            moduleWrapper = {
                type: 'online'
            };
        });

        it('Элемент moduleWrapper.block()[0] есть объект', function() {
            moduleWrapper.block = function() {
                return [{className: 'online_visible online_holy_glob'}];
            };
            mods = appInstance.getModificators(moduleWrapper);
            assert(!mods.visible, 'Пока не умеем распозновать модификаторы без значения типа online_visible');
            // пока умеем распозновать только модификаторы со значениями типа online_holy_glob => { holy: 'glob' }
            assert.ok(mods.holy == 'glob');
        });

        it('Элемент moduleWrapper.block()[0] есть null', function() {
            moduleWrapper.block = function() {
                return [null];
            };
            mods = appInstance.getModificators(moduleWrapper);
            assert.ok(mods);
        });
    });

    describe.skip('-> cookie', function() {
        it('Выставление значения на сервере', function() {
            var callback = sinon.spy();
            app.on('cookie', callback);

            app.cookie('cookieName', 'cookieVal');
            assert.equal(app.cookie('cookieName'), 'cookieVal', 'app.cookie должен вернуть выставленное ранее значение');

            assert(callback.calledOnce, 'callback должен был быть вызван единажды');
        });

        it('Чтение на сервере клиентских кук', function() {
            var value = 'qwebaksfgahli8';

            app.init({
                cookies: {
                    key: value
                }
            });

            assert.equal(app.cookie('key'), value, 'app.cookie должен вернуть выставленное на клиенте значение');

            app.removeCookie('key');
            assert(!app.cookie('key'), 'app.cookie не должен вернуть выставленное на клиенте значение, ведь его удалили выше');
        });
    });

    describe('-> mod', function() {
        it('Вызов без аргументов', function(done) {
            try {
                appConfig.mod();
            } catch (e) {
                done();
            }
        });

        it('Вызов без объекта модификаторов', function() {
            app.internals.moduleDescriptors = {
                '1': {
                    moduleConf: {},
                    mods: {}
                }
            };

            var mods = appConfig.mod('1');

            assert.deepEqual(mods, {});
        });

        it('jQuery-like', function() {
            app.internals.moduleDescriptors = {
                '1': {
                    moduleConf: {},
                    mods: {}
                }
            };

            var val = appConfig.mod('1', 'key');
            assert.equal(val, undefined);

            val = appConfig.mod('1', 'key', 999);
            assert.deepEqual(val, {key: 999});

            val = appConfig.mod('1', 'key');
            assert.equal(val, 999);
        });

        it('Вызов с объектом модификаторов', function() {
            var setMods = {
                key: 'value',
                logic: true,
                'null': null,
                num: Infinity,
                nu: 999
            };

            app.internals.moduleDescriptors = {
                '1': {
                    moduleConf: {},
                    mods: {}
                }
            };

            var mods = appConfig.mod('1', setMods);

            assert.deepEqual(mods, setMods);

            mods = appConfig.mod('1');

            assert.deepEqual(mods, setMods);
        });

        it('Extend модификаторов', function() {
            var mods1 = {
                key: null
            };
            var mods2 = {
                key2: undefined
            };

            app.internals.moduleDescriptors = {
                '1': {
                    moduleConf: {},
                    mods: {}
                }
            };

            var mods = appConfig.mod('1', mods1);
            assert.deepEqual(mods, mods1);

            mods = appConfig.mod('1', mods2);
            assert.deepEqual(mods, _.extend(mods1, mods2));
        });

        it('modHandlers', function() {
            var setMods = {
                key: 'value',
                logic: true,
                'null': null,
                num: Infinity,
                nu: 999,
                u: undefined
            };

            app.internals.moduleDescriptors = {
                '1': {
                    moduleConf: {
                        modHandlers: {
                            num: function(val) {
                                settedVal = val;

                                var mods = appConfig.mod('1');
                                assert.deepEqual(mods, setMods, 'Модификатор уже должен быть выставлен, до вызова связанного modHandlers');
                            }
                        }
                    },
                    mods: {}
                }
            };

            var spy = sinon.spy(app.internals.moduleDescriptors['1'].moduleConf.modHandlers, 'num');

            appConfig.mod('1', setMods);

            assert(spy.withArgs(Infinity).calledOnce, 'Обработчик должен быть вызван 1 раз');
        });
    });
});