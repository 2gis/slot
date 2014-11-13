/* jshint -W020 */
var assert = require('chai').assert,
    sinon = require('sinon');

describe('Компонент loadScript.', function() {
    var loadScript = require('../lib/loadScript');

    function error() {
        console.error('error');
    }

    var mock = {},
        url = 'http://2gis.ru/wqe/123//124523#$%#!$%!#$%!#$%!#$%!@#$!@#$!@#%$&$^&*(&*(P*()_',
        i = 0;

    function nextUrl() {
        return url + i++;
    }

    document = {
        createElement: function() {
            return mock;
        },

        documentElement: {
            appendChild: function() {}
        }
    };

    it('Попытка использования на сервере', function(done) {
        loadScript = require('../lib/loadScript');

        try {
            loadScript();
        } catch (e) {
            assert.equal(e.message, '[slot loadScript] library should be used only client-side!', 'При попытка использовать на сервере должен бросить исключение');
            done();
        }

    });

    describe('Однократная загрузка. ', function() {
        before(function() {
            loadScript = require('../lib/loadScript');
            loadScript.mock({
                isClient: true
            });
        });

        it('Скрипт загружается', function() {
            var spy = sinon.spy(),
                clock = sinon.useFakeTimers();

            loadScript(nextUrl(), spy);
            assert(!spy.called, 'Колбек не должен быть вызван синхронно');
            clock.tick(1);
            assert(!spy.called, 'Колбек не должен быть вызван до загрузки скрипта');
            clock.tick(1);
            mock.onload(); // Эмулируем событие onload
            assert(spy.calledOnce, 'После отработки onload колбек должен быть вызван 1 раз');

            clock.restore();
        });

        it('Колбек не передан', function() {
            loadScript(nextUrl());
        });

        it('Повторная загрузка уже загруженного скрипта', function() {
            var spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                clock = sinon.useFakeTimers();

            var url = nextUrl();

            loadScript(url, spy1);
            assert(!spy1.called, 'Колбек не должен быть вызван синхронно');
            clock.tick(1);
            assert(!spy1.called, 'Колбек не должен быть вызван до загрузки скрипта');
            clock.tick(1);

            mock.onload(); // Эмулируем событие onload
            assert(spy1.calledOnce, 'После отработки onload первый колбек должен быть вызван 1 раз');

            loadScript(url, spy2);
            assert(spy2.calledOnce, 'Если скрипт уже был успешно загружен, колбек должен дёрнуться синхронно');

            clock.tick(100000);
            assert(spy1.calledOnce, 'Независимо от прошедшего времени, второго вызова колбека быть не может');
            assert(spy2.calledOnce, 'Независимо от прошедшего времени, второго вызова колбека быть не может');

            clock.restore();
        });

        it('Повторная загрузка скрипта, когда первая ещё не отработала', function() {
            var spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                clock = sinon.useFakeTimers();

            var url = nextUrl();

            loadScript(url, spy1);
            assert(!spy1.called, 'Колбек не должен быть вызван синхронно');
            clock.tick(1);
            assert(!spy1.called, 'Колбек не должен быть вызван до загрузки скрипта');
            clock.tick(1);

            loadScript(url, spy2);
            assert(!spy1.called, 'После повторного вызова скрипта по тому же урлу первый колбек не должен быть вызван');
            assert(!spy2.called, 'После повторного вызова скрипта по тому же урлу второй колбек не должен быть вызван');
            clock.tick(1);

            mock.onload(); // Эмулируем событие onload
            assert(spy1.calledOnce, 'После отработки onload первый колбек должен быть вызван 1 раз');
            assert(spy2.calledOnce, 'После отработки onload второй колбек должен быть вызван 1 раз');
            clock.tick(100000);
            assert(spy1.calledOnce, 'Независимо от прошедшего времени, второго вызова колбека быть не может');
            assert(spy2.calledOnce, 'Независимо от прошедшего времени, второго вызова колбека быть не может');

            clock.restore();
        });

        it('Повторный триггер onload', function() {
            var spy = sinon.spy(),
                clock = sinon.useFakeTimers();

            var url = nextUrl();

            loadScript(url, spy);
            assert(!spy.called, 'Колбек не должен быть вызван синхронно');
            clock.tick(1);
            assert(!spy.called, 'Колбек не должен быть вызван до загрузки скрипта');

            mock.onload(); // Эмулируем событие onload
            assert(spy.calledOnce, 'После отработки onload колбек должен быть вызван 1 раз');
            mock.onload();
            clock.tick(1);
            mock.onload();
            mock.onload();
            assert(spy.calledOnce, 'Дополнительный триггер события onload не должен приводить к новому вызову колбека');

            clock.restore();
        });

        it('10 повторных загрузок, из них 5 до onload, 5 после', function() {
            var spy = [],
                clock = sinon.useFakeTimers();

            var url = nextUrl();

            for (var i = 0 ; i < 10 ; i++) {
                spy.push(sinon.spy());
            }

            for (i = 0 ; i < 5 ; i++) {
                loadScript(url, spy[i]);

                for (var j = i ; j >= 0 ; j--) {
                    assert(!spy[j].called, 'Колбек номер ' + i + ' не должен быть вызван синхронно');
                    clock.tick(1);
                    assert(!spy[j].called, 'Колбек номер ' + i + ' не должен быть вызван до загрузки скрипта');
                }
            }

            mock.onload(); // Эмулируем событие onload

            for (i = 0 ; i < 5 ; i++) {
                assert(spy[i].calledOnce, 'Колбек номер ' + i + ' после onload должен быть однократно вызван');
            }

            for (i = 5 ; i < 10 ; i++) {
                loadScript(url, spy[i]);
            }

            for (i = 0 ; i < 5 ; i++) {
                assert(spy[i].calledOnce, 'Колбек номер ' + i + ' должен быть однократно вызван, ведь скрипт уже загружен');
            }

            clock.restore();
        });

        // @TODO Фейл первичной загрузки по таймауту

        // @TODO Отмена триггеров при фейле после фейл-таймаута

        // @TODO Фейл первичной загрузки по таймауту при наличии нескольких слушателей
    });

    describe('Новая загрузка (refresh true). ', function() {
        before(function() {
            loadScript = require('../lib/loadScript');
            loadScript.mock({
                isClient: true
            });
        });

        var url = nextUrl();

        it('Повторная загрузка не должна триггерить повторный onload для первой', function() {
            var spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                mock1 = {},
                mock2 = {},
                clock = sinon.useFakeTimers();

            document = {
                createElement: function() {
                    return mock1;
                },

                documentElement: {
                    appendChild: function() {}
                }
            };

            loadScript(url, spy1, true);
            assert(!spy1.called, 'Колбек 1 не должен быть вызван синхронно');
            mock1.onload(); // Эмулируем событие onload
            assert(spy1.calledOnce, 'После отработки onload колбек должен быть вызван 1 раз');

            document = {
                createElement: function() {
                    return mock2;
                },

                documentElement: {
                    appendChild: function() {}
                }
            };
            loadScript(url, spy2, true);
            assert(!spy2.called, 'Колбек 2 не должен быть вызван синхронно');
            mock2.onload(); // Эмулируем событие onload
            assert(spy2.calledOnce, 'После отработки onload колбек должен быть вызван 1 раз');

            assert(spy1.calledOnce, 'Повторного вызова первого колбека быть не должно');

            clock.restore();
        });
    });

    describe('IE8 (onreadystatechange). ', function() {
        before(function() { // Восстанавливаем мок документа
            loadScript = require('../lib/loadScript');
            loadScript.mock({
                isClient: true
            });

            document = {
                createElement: function() {
                    return mock;
                },

                documentElement: {
                    appendChild: function() {}
                }
            };
        });

        var url = nextUrl();

        it('Повторный триггер onreadystatechange', function() {
            var spy = sinon.spy(),
                clock = sinon.useFakeTimers();

            loadScript(url, spy);
            assert(!spy.called, 'Колбек 1 не должен быть вызван синхронно');
            mock.readyState = 'complete';
            mock.onreadystatechange(); // Эмулируем событие onload
            clock.tick(1);
            assert(spy.calledOnce, 'После отработки onload колбек должен быть вызван 1 раз');

            clock.tick(1);
            mock.readyState = 'loaded';
            mock.onreadystatechange(); // Эмулируем событие onload
            assert(spy.calledOnce, 'Повторного вызова колбека быть не должно');

            clock.restore();
        });
    });
});
/* jshint +W020 */
