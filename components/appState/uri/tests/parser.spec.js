
var assert = require('assert');

var Pattern = require('../pattern');
var helpers = require('../helpers');

function newDef(pattern) {
    return new Pattern(pattern);
}

describe("UriParser", function() {
    var parser = require('./../parser');

    it("в правильном порядке парсит строку #1", function() {
        var patterns = [
            newDef('geo/:id'),
            newDef('filials/:firmId'),
            newDef('query/:query')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("в правильном порядке парсит строку #1.1", function() {
        var patterns = [
            newDef('geo/:id'),
            newDef('query/:query'),
            newDef('filials/:firmId')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("в правильном порядке парсит строку #2", function() {
        var patterns = [
            newDef('query/:query'),
            newDef('filials/:firmId'),
            newDef('geo/:id')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("в правильном порядке парсит строку #2.1", function() {
        var patterns = [
            newDef('query/:query'),
            newDef('filials/:firmId'),
            newDef('geo/:id')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("в правильном порядке парсит строку #3", function() {
        var patterns = [
            newDef('filials/:firmId'),
            newDef('query/:query'),
            newDef('geo/:id')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("в правильном порядке парсит строку #3.1", function() {
        var patterns = [
            newDef('filials/:firmId'),
            newDef('geo/:id'),
            newDef('query/:query')
        ];

        var state = parser.parse(patterns, 'filials/2/geo/4/query/5');

        assert.equal(state.length, 3);

        assert.equal(state[0].slug, 'filials');
        assert.equal(state[1].slug, 'geo');
        assert.equal(state[2].slug, 'query');
    });

    it("правильно парсит сложные правила (> 1 slug'а на правило)", function() {
        var patterns = [
            newDef('query/:query/filters/:filters'),
            newDef('query/:query'),
            newDef('filials/:firmId'),
            newDef('geo/:id')
        ];

        var state =  parser.parse(patterns, 'query/пиво/filters/food_service_wifi:true:food_service_business_lunch:true');

        assert.equal(state.length, 1);
        assert.equal(state[0].slug, 'query');
    });

    it("правильно парсит кириллицу с алиасами", function() {
        var patterns = [
            newDef('booklet/:bookletId')
        ];

        var expectedState = {
            bookletId: 'сбербанк'
        };

        var aliases = [
            helpers.makeAlias('booklet/:bookletId', {bookletId: 'сбербанк'}, 'сбербанк')
        ];

        var state = parser.parse(patterns, 'сбербанк', aliases)[0];

        assert.deepEqual(state.params, expectedState);
        assert.equal(state.slug, 'booklet');
    });
});
