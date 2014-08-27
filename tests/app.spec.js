var assert = require('assert');
var sinon = require('sinon');

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
        it('app.cookie возвращает верное значение на сервере и бросает событие', function() {
            var callback = sinon.spy();
            app.on('cookie', callback);

            assert.deepEqual(app.cookie('cookieName', 'cookieVal'), {cookieName: 'cookieVal'}, 'app.cookie должен вернуть объект {cookieName: \'cookieVal\'}');

            assert(callback.calledOnce, 'callback должен был быть вызван единажды');
        });
    });

});