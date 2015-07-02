var assert = require('chai').assert;
var _ = require('lodash');
var async = require('async');

describe('Namer', function() {

    var namer = require('../lib/namer');

    describe('.moduleClass', function() {
        it('Простой модуль', function() {
            var module = 'firmCard';

            assert(namer.moduleClass(module) == module);
        });
    });

    describe('.elementClass', function() {
        it('Простой элемент и модуль', function() {
            var module = 'simple',
                element = 'zazaza';

            assert.equal(namer.elementClass(module, element), 'simple__zazaza');
        });

        it('Составной модуль простой элемент', function() {
            var module = 'cOm-plex',
                element = 'element';

            assert.equal(namer.elementClass(module, element), 'cOm-plex__element');
        });

        it('Простой модуль составной элемент', function() {
            var module = 'simple',
                element = 'filterFirm-card';

            assert.equal(namer.elementClass(module, element), 'simple__filterFirm-card');
        });

        it('Составные модуль и элемент', function() {
            var module = 'cOm-plex',
                element = 'form-buttonOut';

            assert.equal(namer.elementClass(module, element), 'cOm-plex__form-buttonOut');
        });
    });

    describe('.modificatorClass', function() {
        it('Правильно составляет модификатор для value == false', function() {
            var name = 'addressExistance',
                value = false;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value == true', function() {
            var name = 'addressExistance',
                value = true;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance');
        });

        it('Правильно составляет модификатор для value == undefined', function() { // http://jira/browse/ONLINE-214
            var name = 'addressExistance',
                value;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value == null', function() {
            var name = 'addressExistance',
                value = null;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value == NaN', function() {
            var name = 'addressExistance',
                value = NaN;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value == 0', function() {
            var name = 'addressExistance',
                value = 0;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance_0');
        });

        it('Правильно составляет модификатор для value == 128', function() {
            var name = 'addressExistance',
                value = 128;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance_128');
        });

        it('Правильно составляет модификатор для value == "false"', function() {
            var name = 'addressExistance',
                value = 'false';

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance_false');
        });

        it('Правильно составляет модификатор для value == "true"', function() {
            var name = 'addressExistance',
                value = 'true';

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance_true');
        });

        it('Возвращает ничего если в ключе нет символов', function(done) {
            var name = '',
                value = 'true';

            try {
                namer.modificatorClass(name, value);
            } catch (e) {
                done();
            }
        });
    });

    describe('.parseMods', function() {
        it('Правильно вычисляет модификаторы для className == ""', function() {
            var className = '';

            assert.deepEqual(namer.parseMods(className), {});
        });

        it('Правильно вычисляет модификаторы для className == "   "', function() {
            var className = '    ';

            assert.deepEqual(namer.parseMods(className), {});
        });

        it('Правильно вычисляет модификаторы для className == "otherClass"', function() {
            var className = 'otherClass';

            assert.deepEqual(namer.parseMods(className), {});
        });

        it('Правильно вычисляет модификаторы для className == "_one "', function() {
            var className = '_one ';

            assert.deepEqual(namer.parseMods(className), { one: true });
        });

        it('Правильно вычисляет модификаторы для className == "otherClass _one"', function() {
            var className = 'otherClass _one';

            assert.deepEqual(namer.parseMods(className), { one: true });
        });

        it('Правильно вычисляет модификаторы для className == " otherClass _one_true "', function() {
            var className = ' otherClass _one_true ';

            assert.deepEqual(namer.parseMods(className), { one: 'true' });
        });

        it('Правильно вычисляет модификаторы для className == " otherClass _one_1054 "', function() {
            var className = ' otherClass _one_1054 ';

            assert.deepEqual(namer.parseMods(className), { one: 1054 });
        });

        it('Правильно вычисляет модификаторы для className == " otherClass _one_1054 _two_str _tree "', function() {
            var className = '_one_1054 _two_str _tree _four_false otherClass';

            assert.deepEqual(
                namer.parseMods(className),
                { one: 1054, two: 'str', tree: true, four: 'false' }
            );
        });
    });

    describe('.stringifyMods', function() {
        var data = [{
            mods: {},
            expected: [],
            comment: 'Пустой объект модификаторов должен возвращать пустой массив классов'
        }, {
            mods: {'0': null, 'false': false},
            expected: [],
            comment: 'false-значения не должны попадать в классы'
        }, {
            mods: {'a0_290': 'inq', key: 'value', a: 'b', qwe: false, asd: true},
            expected: ['_a0_290_inq', '_key_value', '_a_b', '_asd'],
            comment: 'Должно правильно конкатинировать _key_value'
        }];

        it('Получение класснеймов из объекта модификаторов', function() {
            _.each(data, function(it) {
                var result = namer.stringifyMods(it.mods);
                assert.deepEqual(result, it.expected, it.comment + ':' + result);
            });
        });

        it('Бросание exception при неправильных аргументах', function(done) {
            var wrongVals = [
                null,
                false,
                NaN,
                4,
                'asd'
            ];

            async.series(_.map(wrongVals, function(val) {
                return function(cb) {
                    try {
                        namer.stringifyMods(val);
                    } catch (e) {
                        cb();
                    }
                };
            }), done);
        });
    });

    describe('.parseElementClass', function() {
        it('Правильно вычисляет модуль и элемент для className == ""', function() {
            var className = '';

            assert.deepEqual(namer.parseElementClass(className), undefined);
        });

        it('Правильно вычисляет модуль и элемент для className == "   "', function() {
            var className = '    ';

            assert.deepEqual(namer.parseElementClass(className), undefined);
        });

        it('Правильно вычисляет модуль и элемент для className == "otherClass"', function() {
            var className = 'otherClass';

            assert.deepEqual(namer.parseElementClass(className), undefined);
        });

        it('Правильно вычисляет модуль и элемент для className == "module_element "', function() {
            var className = 'module_element ';

            assert.deepEqual(namer.parseElementClass(className), undefined);
        });

        it('Правильно вычисляет модуль и элемент для className == "module__element"', function() {
            var className = 'module__element';

            assert.deepEqual(namer.parseElementClass(className), { block: 'module', element: 'element' });
        });

        it('Правильно вычисляет модуль и элемент для className == " otherClass module__element "', function() {
            var className = ' otherClass module__element ';

            assert.deepEqual(namer.parseElementClass(className), { block: 'module', element: 'element' });
        });
    });

});
