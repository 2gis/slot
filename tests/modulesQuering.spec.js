
var Quering = require('../lib/modulesQuering'),
    _ = require('lodash'),
    assert = require('assert');

describe('ModulesQuering', function() {

    var m = function(cfg) {
        return _.defaults(cfg, {
            moduleConf: {},
            slot: {
                mod: function() {
                    return {};
                }
            }
        });
    };

    var moduleDescriptors = {
        '1': m({
            type: 'root',
            children: ['1-1', '1-2']
        }),
        '1-1': m({
            type: 'moscow',
            moduleConf: {
                interface: {
                    now: function(id) {
                        return id == 1;
                    }
                }
            },
            slot: {
                mod: function() {
                    return {'active': true};
                }
            },
            children: ['1-1-1', '1-1-2']
        }),
        '1-2': m({
            type: 'moscow',
            moduleConf: {
                interface: {
                    now: function(id) {
                        return id == 2;
                    }
                }
            },
            children: ['1-2-1']
        }),
        '1-1-1': m({
            type: 'himki',
            slot: {
                mod: function() {
                    return {'active': 1};
                }
            },
            moduleConf: {
                interface: {
                    xx: function(id) {
                        return id == 6;
                    }
                }
            }
        }),
        '1-1-2': m({
            type: 'birulevo'

        }),
        '1-2-1': m({
            type: 'himki'
        })
    };

    var query = Quering(moduleDescriptors);

    function byId(id) {
        return moduleDescriptors[id];
    }

    it('Простой селектор', function() {
        assert.deepEqual(query('1', 'moscow')[0], byId('1-1'));
    });

    it('Составной с предикатам по модификатору', function() {
        var r = query('1', 'moscow[active] himki');
        assert.equal(r.length, 1, 'himki=1, actual:' + r.length);

        assert.deepEqual(r[0], byId('1-1-1'));
    });

    it('Составной с предикатам по методу', function() {
        var r = query('1', 'moscow[::now(1)] himki');
        assert.equal(r.length, 1, 'himki=1, actual:' + r.length);

        assert.deepEqual(r[0], byId('1-1-1'));
    });

    it('Составной с предикатам по методу которого нет', function() {
        var r = query('1', 'moscow[::sg(1)]');
        assert.equal(r.length, 0, 'himki=0, actual:' + r.length);
    });

    it('Простой с предикатом на вложенный элемент', function() {
        var r = query('1', 'himki[::xx(6)]');
        assert.equal(r.length, 1, 'himki=1, actual:' + r.length);

        assert.deepEqual(r[0], byId('1-1-1'));
    });

    it('Простой на вложенный элемент', function() {
        var r = query('1', 'himki');
        assert.equal(r.length, 2, 'himki=2, actual:' + r.length);

        assert.deepEqual(r[0], byId('1-1-1'));
    });

    it('wildcard с предикатами', function() {
        var r = query('1', '*[::now(2)]');
        assert.equal(r.length, 1);

        assert.deepEqual(r[0], byId('1-2'));
    });

    it('предикат :first-child', function() {
        var r = query('1', 'moscow[:first-child]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-1'));
    });

    it('предикат :last-child', function() {
        var r = query('1', 'moscow[:last-child]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-2'));
    });

    it('предикат с модификатором', function() {
        var r = query('1', '*[active]');
        assert.equal(r.length, 1);

        r = query('1', '*[active=*]');
        assert.equal(r.length, 2);

        r = query('1', '*[active=2]');
        assert.equal(r.length, 0);
    });

    it('без inclusive не ищет рутовый модуль', function() {
        var r = query('1', 'root');
        assert.equal(r.length, 0);
    });

    it('с inclusive ищет рутовый модуль', function() {
        var r = query('1', 'root', true);
        assert.equal(r.length, 1);

        assert.deepEqual(r[0], byId('1'));
    });

    it('все модули', function() {
        assert.equal(query('1', '*').length, 5);
    });

    it('несколько предикатов', function() {
        r = query('1', '*[active=*][::xx(6)]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-1-1'));

        r = query('1', 'moscow[::now(1)][qwe]');
        assert.equal(r.length, 0);
    });

    it('предикаты :last и :first', function() {
        r = query('1', 'moscow[:first]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-1'));

        r = query('1', 'moscow[:last]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-2'));

        r = query('1', '*[active=*][:last]');
        assert.equal(r.length, 1);
        assert.deepEqual(r[0], byId('1-1-1'));
    });
});