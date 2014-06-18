
var Quering = require('../modulesQuering'),
    _ = require('underscore'),
    assert = require('assert');

describe("Core->modulesQuering", function() {

    var m = function(cfg) {
        return _.defaults(cfg, {
            instance: {},
            slot: {
                mod: function() {
                    return {};
                }
            }
        });
    };

    var internals = {
        moduleInstances: {
            "1": m({
                type: "root",
                children: ["1-1", "1-2"]
            }),
            "1-1": m({
                type: "moscow",
                instance: {
                    interface: {
                        now: function(id) {
                            return id == 1;
                        }
                    }
                },
                children: ["1-1-1", "1-1-2"]
            }),
            "1-2": m({
                type: "moscow",
                instance: {
                    interface: {
                        now: function(id) {
                            return id == 2;
                        }
                    }
                },
                children: ["1-2-1"]
            }),
            "1-1-1": m({
                type: "himki",
                slot: {
                    mod: function() {
                        return {'active': 'true'};
                    }
                }
            }),
            "1-1-2": m({
                type: "birulevo"

            }),
            "1-2-1": m({
                type: "himki"
            })
        }
    };

    var query = Quering(internals);

    function byId(id) {
        return internals.moduleInstances[id];
    }

    it("Простой селектор", function() {
        assert.deepEqual(query('1', 'moscow')[0], byId("1-1"));
    });

    it("Составной с предикатами", function() {
        var r = query('1', 'moscow[now=1] himki');
        assert.equal(r.length, 1, "himki=1, actual:" + r.length);

        assert.deepEqual(r[0], byId("1-1-1"));
    });

    it("wildcard с предикатами", function() {
        var r = query('1', '*[now=2]');
        assert.equal(r.length, 1);

        assert.deepEqual(r[0], byId("1-2"));
    });

    it("предикат с модификатором", function() {
        var r = query('1', '*[:active]');
        assert.equal(r.length, 1);

        r = query('1', '*[:active=true]');
        assert.equal(r.length, 1);

        r = query('1', '*[:active=false]');
        assert.equal(r.length, 0);
    });

    it("все модули", function() {
        assert.equal(query('1', '*').length, 5);
    });

});