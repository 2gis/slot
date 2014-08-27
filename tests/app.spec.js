var assert = require('assert');

describe.skip('Core -> app', function() {
    var app = require('../app.js');

    it('blank', function() {

        assert(app);
    });

    describe('-> getModificators', function() {
        var mods;
        var appInstance = app().instance;
        var moduleWrapper = {
            type: 'online'
        };

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

    describe('-> cookie', function() {
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
});