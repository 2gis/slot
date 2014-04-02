var assert = require('assert');

describe('Core -> namer', function() {
    var namer = require('../namer');

    describe('.modificatorClassTemp', function() {
        it('Правильно составляет модификатор', function() {
            var module = 'firmCardExample',
                name = 'address-existAnce',
                value = true;

            var mod = namer.modificatorClassTemp(module, name, value);

            assert(mod === 'firm-card-example_address-exist-ance_true');
        });

        it('Правильно составляет модификатор для value === null', function() {
            var module = 'firmCardExample',
                name = 'address-existAnce',
                value = true;

            var mod = namer.modificatorClassTemp(module, name, null);

            assert(mod === '');
        });

        it('Правильно составляет модификатор для value === undefined', function() { // http://jira/browse/ONLINE-214
            var module = 'firmCardExample',
                name = 'address-existAnce',
                value = true;

            var mod = namer.modificatorClassTemp(module, name, undefined);

            assert(mod === '');
        });

        it('Правильно составляет модификатор для value === false', function() {
            var module = 'firmCardExample',
                name = 'address-existAnce',
                value = true;

            var mod = namer.modificatorClassTemp(module, name, false);

            assert(mod === 'firm-card-example_address-exist-ance_false');
        });

        it('Правильно составляет модификатор для value === 0', function() {
            var module = 'firmCardExample',
                name = 'address-existAnce',
                value = true;

            var mod = namer.modificatorClassTemp(module, name, 0);

            assert(mod === 'firm-card-example_address-exist-ance_0');
        });
    });

    describe('.modificatorClass', function() {
        it('Правильно составляет модификатор', function() {
            var name = 'addressExistance',
                value = true;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance');
        });

        it('Правильно составляет модификатор для value === null', function() {
            var name = 'addressExistance',
                value = null;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value === undefined', function() { // http://jira/browse/ONLINE-214
            var name = 'addressExistance',
                value;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value === false', function() {
            var name = 'addressExistance',
                value = false;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        it('Правильно составляет модификатор для value === 0', function() {
            var name = 'addressExistance',
                value = 0;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance_0');
        });

        it('Правильно составляет модификатор для value === true', function() {
            var name = 'addressExistance',
                value = true;

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance');
        });

        // @TODO временный тест
        it('Правильно составляет модификатор для value === "false"', function() {
            var name = 'addressExistance',
                value = 'false';

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '');
        });

        // @TODO временный тест
        it('Правильно составляет модификатор для value === "true"', function() {
            var name = 'addressExistance',
                value = 'true';

            var mod = namer.modificatorClass(name, value);

            assert.equal(mod, '_addressExistance');
        });
    });

    describe('-> modificatorClass', function() {
        it('Общие кейсы отдают правильные названия класса для модификатора элемента', function() {
            var name = 'visible',
                value = true,
                mod = namer.modificatorClass(name, value);
            assert.ok(mod === '_visible');

            value = 'true';
            mod = namer.modificatorClass(name, value);
            assert.ok(mod === '_visible_true');
        });

        it('Передали значение false или null', function() {
            var name = 'visible',
                value = false,
                mod = namer.modificatorClass(name, value);
            assert.ok(mod === '');

            value = null;
            mod = namer.modificatorClass(name, value);
            assert.ok(mod === '');
        });

        it('Передали значение undefined', function() {
            var name = 'visible',
                value,
                mod = namer.modificatorClass(name, value);
            assert.ok(mod === null);
        });

        it('Передали falsy имя модификатора', function() {
            var name = '',
                value = 'what would you do without name huh?',
                mod = namer.modificatorClass(name, value);
            assert.ok(mod === null);

            name = 0;
            mod = namer.modificatorClass(name, value);
            assert.ok(mod === null);

            name = false;
            mod = namer.modificatorClass(name, value);
            assert.ok(mod === null);

            name = undefined;
            mod = namer.modificatorClass(name, value);
            assert.ok(mod === null);
        });

        it('Название класса ок, если имя состоит > чем из 1 слова', function() {
            var name = 'visibleMagic',
                value = true,
                mod = namer.modificatorClass(name, value);
            assert.equal(mod, '_visibleMagic');
        });

        it('Название класса ок, если значение состоит > чем из 1 слова', function() {
            var name = 'visibleMagic',
                value = 'holyGlob',
                mod = namer.modificatorClass(name, value);
            assert.ok(mod === '_visibleMagic_holyGlob');
        });
    });

    describe('-> isClassAModificator', function() {
        it('Самый простой правильный кейс', function() {
            var moduleName = 'online',
                className = 'online_full_true';
            assert(namer.isClassAModificator(moduleName, className));
        });
        it('Название модуля больше, чем из одного слова', function() {
            var moduleName = 'firmCardExample',
                className = 'firm-card-example_full_true';
            assert(namer.isClassAModificator(moduleName, className));
        });
        it('Ругается, если в классе нет названия модуля', function() {
            var moduleName = 'firmCardExample',
                className = 'firmCardExamples_full_true'; // лишнюю букву в название модуля
            assert(namer.isClassAModificator(moduleName, className) == false);
        });
        it('Ругается, если в классе больше, больше или меньше, чем 2 подчеркивания', function() {
            var moduleName = 'firmCardExample',
                className = 'firmCardExample_full_true_false'; // 3 подчеркивания
            assert(namer.isClassAModificator(moduleName, className) == false);

            className = 'firmCardExample_full'; // 1 подчеркивание
            assert(namer.isClassAModificator(moduleName, className) == false);
        });
    });

    describe('-> getModificatorFromClass', function() {
        it('Самый простой модификатор', function() {
            var className = '_full_true',
                mod = { full: true };

            assert(namer.getModificatorFromClass(className), mod);
        });
        it('Модификатор больше, чем из одного слова', function() {
            var className = 'online_full-bull_true',
                mod = { fullBull: true };

            assert(namer.getModificatorFromClass(className).fullBull, mod.fullBull);
        });
    });

    describe('-> elementClass', function() {
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

    // Обратная совместимость
    describe('-> elementClass(..., ..., true)', function() {
        it('Простой элемент и модуль', function() {
            var module = 'simple',
                element = 'zazaza';

            assert.equal(namer.elementClass(module, element, true), 'simple__zazaza');
        });

        it('Составной модуль простой элемент', function() {
            var module = 'cOm-plex',
                element = 'element';

            assert.equal(namer.elementClass(module, element, true), 'c-om-plex__element');
        });

        it('Простой модуль составной элемент', function() {
            var module = 'simple',
                element = 'filterFirm-card';

            assert.equal(namer.elementClass(module, element, true), 'simple__filter-firm-card');
        });

        it('Составные модуль и элемент', function() {
            var module = 'cOm-plex',
                element = 'form-buttonOut';

            assert.equal(namer.elementClass(module, element, true), 'c-om-plex__form-button-out');
        });
    });
});
