
var _ = require('lodash');
var assert = require('assert');
var helper = require('slot/clientApp/transitions');

describe('transitions helpers', function() {
    it('-> sort #1', function() {
        var transitions = [
            {purpose: 'callout'},
            {purpose: 'map', id: 1},
            {purpose: 'panels'},
            {purpose: 'panels'},
            {purpose: 'map', id: 2}
        ];

        helper.sort(transitions);

        assert.equal(transitions[0].purpose, 'map', 'Первый транзишен стал map');
        assert.equal(transitions[0].id, 1);
        assert.equal(transitions[transitions.length - 1].purpose, 'callout', 'Последний транзишен стал callout');
        assert.deepEqual(_.pluck(transitions, 'purpose'), ['map', 'panels', 'panels', 'map', 'callout']);

    });

    it('-> sort #2', function() {
        var transitions = [
            {purpose: 'callout', id: 1},
            {purpose: 'map', id: 2},
            {purpose: 'panels', id: 3},
            {purpose: null, id: 4},
            {purpose: 'panels', id: 5},
            {purpose: 'callout', id: 6},
            {purpose: 'map', id: 7}
        ];

        helper.sort(transitions);
        assert.deepEqual(_.pluck(transitions, 'purpose'), ['map', 'panels', null, 'panels', 'map', 'callout', 'callout']);
        assert.deepEqual(_.pluck(transitions, 'id'), [2, 3, 4, 5, 7, 1, 6]);
    });
});