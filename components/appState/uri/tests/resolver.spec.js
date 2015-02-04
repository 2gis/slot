
var _ = require('lodash');
var resolver = require('./../resolver');
var helpers = require('./../helpers');
var StateConf = require('../../stateConf');
var assert = require('assert');

function inject(entry, state) {
    state[entry.slug] = entry.params;

    return state[entry.slug];
}

function makeConf(patterns) {
    var structured = {};
    _.each(patterns, function(p) {
        structured[p] = inject;
    });
    return new StateConf({urls: structured});
}

describe("UrlResolver", function() {
    it("правильно преобразует стэйт в строку", function() {
        var conf = makeConf([
            'search/:query/filters/:filters',
            'search/:query',
            'row/:row',
            'inbuild/:house'
        ]);

        var state = {
            search: {
                query: 'пиво'
            },
            inbuild: {
                house: 13
            }
        };

        assert.equal(decodeURIComponent(resolver(conf, state)), 'search/пиво/inbuild/13');
    });

    it("правильно алиасит кириллицу", function() {
        var conf = makeConf([
            'booklet/:bookletId'
        ]);

        var state = {
            booklet: {
                bookletId: 'сбербанк'
            }
        };

        var aliases = [
            helpers.makeAlias('booklet/:bookletId', {bookletId: 'сбербанк'}, 'сбербанк')
        ];

        assert.equal(decodeURIComponent(resolver(conf, state, aliases)), 'сбербанк');

    });
});