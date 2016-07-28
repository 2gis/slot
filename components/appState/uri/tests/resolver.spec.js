
var _ = require('lodash');
var resolveUrl = require('./../resolver').resolveUrl;
var helpers = require('./../helpers');
var StateConf = require('../../stateConf');
var assert = require('assert');

function inject(entry, state) {
    state[entry.slug] = entry.params;

    return state[entry.slug];
}

var queryParamName = 'queryState';
function makeConf(patterns, queryParamsList) {
    var structured = {};
    _.each(patterns, function(p) {
        structured[p] = inject;
    });
    return new StateConf({
        urls: structured,
        queryParamName: queryParamName,
        queryParamsList: queryParamsList
    });
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

        assert.equal(decodeURIComponent(resolveUrl(conf, state)), 'search/пиво/inbuild/13');
    });

    it("правильно преобразует стэйт в строку c GET-параметрами", function() {
        var conf = makeConf([
            'zoom/:zoom',
            'center/:lat,:lon',
            'inbuild/:house'
        ], ['zoom', 'center']);

        var state = {
            search: {
                query: 'пиво'
            },
            inbuild: {
                house: 13
            },
            zoom: {
                zoom: 15
            },
            center: {
                lat: 12,
                lon: 10
            }
        };

        assert.equal(decodeURIComponent(resolveUrl(conf, state)), 'inbuild/13?' + queryParamName + '=zoom/15/center/12,10');
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

        assert.equal(decodeURIComponent(resolveUrl(conf, state, aliases)), 'сбербанк');

    });
});
