var assert = require('assert');
var sinon = require('sinon');
var _ = require('lodash');
var Application = require('../app');

describe('app', function() {
    var app,
        appIntance,
        appConfig;

    beforeEach(function() {
        app = new Application();
        DEBUG = true;
        appIntance = app;
        appConfig = app;
    });

    it('blank', function() {
        assert(app);
    });

    describe(' plugins', function() {
        it('Подключает только те плагины, которые указаны в конфиге', function() {
            var env = require('../env');
            var appConfig = env.getConfig();
            appConfig.plugins = ['ua'];
            app = new Application();
            appIntance = app;

            assert(_.isFunction(appIntance.ua), 'После инициализации плагин ua должен подключиться, ведь он в конфиге');
            assert(!appIntance.fpsMeter, 'После инициализации плагин fpsMeter не должен подключиться, ведь его нет в конфиге');
        });
    });

    describe('-> init', function() {
        it('Ругается если нет поля req', function(done) {
            try {
                appIntance.init();
            } catch (e) {
                done();
            }
        });

        it('Правильное значение поля _stage', function() {
            appIntance.init({}, _.noop);
            assert(appIntance._stage == 'init', 'Поле _stage должно иметь значение "init"');
        });

        it('Данные записались в registry', function() {
            var data = {
                host: '1',
                protocol: '2',
                port: '3'
            };
            appIntance.init(data, _.noop);
            assert(appIntance.registry.get('host') == '1' && appIntance.registry.get('protocol') == '2' && appIntance.registry.get('port') == '3',
                'Переданные данные должны были записаться в registry');
        });

        it('Данные записываются и удаляются из cookie', function() {
            var data = {
                cookies: {
                    a: '1'
                }
            };
            appIntance.init(data, _.noop);
            assert(appIntance.cookie('a') == '1', 'Переданные cookie должны были записаться');
            appIntance.cookie('b', '2');
            assert(appIntance.cookie('b') == '2', 'Установленная cookie должна была записаться');

            appIntance.removeCookie('b');
            assert(appIntance.cookie('b') === undefined, 'Cookie должна была удалиться');
        });

        it('Вызывается callback после инициализации', function() {
            var callback = sinon.spy();
            appIntance.init({}, callback);
            assert(callback.calledOnce, 'Функция callback должны быть вызвана единажды');
        });

        it('Функции initStart выполняются, инициализация продолжается', function() {
            var initStart = sinon.spy(function(cb) {
                cb();
            });
            var callback = sinon.spy();

            appIntance.on('initStart', function(params) {
                params.waitFor(initStart);
            });

            appIntance.init({}, callback);
            assert(initStart.calledOnce, 'Функция initStart должны быть вызвана единажды');
            assert(callback.calledOnce, 'Функция callback должны быть вызвана единажды');
        });

        it('Функции initStart без коллбэка выполняются, инициализация продолжается', function() {
            var initStart = sinon.spy();
            var callback = sinon.spy();

            appIntance.on('initStart', function(params) {
                params.waitFor(initStart);
            });

            appIntance.init({}, callback);
            assert(initStart.calledOnce, 'Функция initStart должны быть вызвана единажды');
            assert(callback.calledOnce, 'Функция callback должны быть вызвана единажды');
        });

        it('Функции, переданные в initStart не являются функциями', function() {
            var callback = sinon.spy();

            appIntance.on('initStart', function(params) {
                params.waitFor();
            });

            appIntance.init({}, callback);
            assert(callback.calledOnce, 'Функция callback должны быть вызвана единажды, инициализация не сломалась');
        });

        it('Передаём в waitFor синхронную функцию', function() {
            var callback = sinon.spy();
            var delayer = sinon.spy();

            appIntance.on('initStart', function(params) {
                params.waitFor(delayer);
            });

            appIntance.init({}, callback);
            assert(delayer.calledOnce, 'Функция delayer должны быть вызвана единажды, инициализация не сломалась');
            assert(callback.calledOnce, 'Функция callback должны быть вызвана единажды, инициализация не сломалась');
        });

        it('Передаём в waitFor две асинхронные функции', function(done) {
            var callback = sinon.spy();
            var delayers = {
                one: function(cb) {
                    setTimeout(cb, 1);
                },
                two: function(cb) {
                    setTimeout(cb, 30);
                },
                callback: function() {
                    done();
                }
            };

            sinon.spy(delayers, 'one');
            sinon.spy(delayers, 'two');
            sinon.spy(delayers, 'callback');

            appIntance.on('initStart', function(params) {
                params.waitFor(delayers.one);
                params.waitFor(delayers.two);
            });

            appIntance.init({}, function() {
                assert(delayers.one.calledOnce, 'Функция delayer 1 должны быть вызвана единажды, инициализация не сломалась');
                assert(delayers.one.calledOnce, 'Функция delayer 2 должны быть вызвана единажды, инициализация не сломалась');
                delayers.callback();
                assert(delayers.callback.calledOnce, 'Функция callback должны быть вызвана единажды, инициализация не сломалась');
            });
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
            app._moduleDescriptors = {
                '1': {
                    moduleConf: {},
                    mods: {}
                }
            };

            var mods = appConfig.mod('1');

            assert.deepEqual(mods, {});
        });

        it('jQuery-like', function() {
            app._moduleDescriptors = {
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

            app._moduleDescriptors = {
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

            app._moduleDescriptors = {
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

            app._moduleDescriptors = {
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

            var spy = sinon.spy(app._moduleDescriptors['1'].moduleConf.modHandlers, 'num');

            appConfig.mod('1', setMods);

            assert(spy.withArgs(Infinity).calledOnce, 'Обработчик должен быть вызван 1 раз');
        });

        it('modHandlers вызывается после навешивания всех классов', function() {
            var setMods = {
                num: 1,
                active: true
            };

            var jQueryFake = {
                addClass: function() {},
                removeClass: function() {}
            };

            sinon.spy(jQueryFake, 'addClass');
            sinon.spy(jQueryFake, 'removeClass');

            app._moduleDescriptors = {
                '1': {
                    moduleConf: {
                        modHandlers: {
                            num: function(val) {
                                assert(jQueryFake.addClass.withArgs('_active').calledOnce, 'numHandler: Класс модификатора _active должен быть уже навешан');
                                assert(jQueryFake.addClass.withArgs('_num_1').calledOnce, 'numHandler: Класс модификатора _num_1 должен быть уже навешан');
                            },
                            active: function(val) {
                                assert(jQueryFake.addClass.withArgs('_active').calledOnce, 'activeHandler: Класс модификатора _active должен быть уже навешан');
                                assert(jQueryFake.addClass.withArgs('_num_1').calledOnce, 'activeHandler: Класс модификатора _num_1 должен быть уже навешан');
                            }
                        }
                    },
                    mods: {}
                }
            };

            appConfig.isClient = true;
            appConfig.block = function() {
                return jQueryFake;
            };

            var numSpy = sinon.spy(app._moduleDescriptors['1'].moduleConf.modHandlers, 'num');
            var activeSpy = sinon.spy(app._moduleDescriptors['1'].moduleConf.modHandlers, 'active');

            appConfig.mod('1', setMods);

            assert(numSpy.withArgs(1).calledOnce, 'Обработчик должен быть вызван 1 раз');
            assert(activeSpy.withArgs(true).calledOnce, 'Обработчик должен быть вызван 1 раз');
        });
    });

    describe('-> getModuleDescriptorById', function() {
        it('Бросает исключение, если модуль не найден', function() {
            assert.throws(
                function() {
                    appConfig.getModuleDescriptorById('notExistingModule-id');
                },
                Error
            );
        });
    });
});
