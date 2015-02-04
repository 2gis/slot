
var assert = require('chai').assert;
var cmp = require('../cmp');
var _ = require('lodash');

describe("lib/cmp", function() {

    function cleanArraysDiff(diff) {
        delete diff.isEqual;
    }

    it('сравниваем простые плоские структуры', function() {
        var state1 = {
            map: {
                val: 2,
                pos: {x: 1}
            },
            callout: true,
            wasProp: 1
        };

        var state2 = {
            map: {
                val: 2,
                pos: {x: 2}
            },
            callout: true
        };

        var diff = cmp.states(state1, state2);
        assert.deepEqual(diff, {
            map: {
                val: 2,
                pos: { x: 2 }
            },
            wasProp: null
        });
    });

    it('сравнение {} → {key: [array]}', function() {
        var state1 = {};
        var state2 = {"panels":[{"type":"query","query":"пиво"}]};

        var diff = cmp.states(state1, state2);
        assert(diff, "объекты различаются");
        cleanArraysDiff(diff.panels);
        assert.deepEqual(diff, {
            panels: {
                added: [{"type":"query","query":"пиво"}],
                value: [{"type":"query","query":"пиво"}]
            }
        });
    });

    it("сравниваем {} → {city: city}", function() {
        var state1 = {};
        var state2 = {
            city: {
                city: 7
            }
        };
        var diff = cmp.states(state1, state2);
        assert.deepEqual(diff, {
            city: {
                city: 7
            }
        });
    });

    it("сравниваем {city: city1} → {city: city2}", function() {
        var state1 = {
            city: {
                city: 4
            }
        };
        var state2 = {
            city: {
                city: 7
            }
        };
        var diff = cmp.states(state1, state2);
        assert.deepEqual(diff, {
            city: {
                city: 7
            }
        });
    });

    it("сравниваем плоские структуры", function() {
        var state1 = {
        };

        var state2 = {
            showSameFoo: true
        };

        var diff = cmp.states(state1, state2);
        assert.deepEqual(diff, {
            showSameFoo: true
        });
    });
});