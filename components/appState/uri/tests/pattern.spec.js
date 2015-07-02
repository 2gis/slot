
var assert = require('assert');

describe("uri/pattern", function() {

    var Pattern = require('./../pattern'),
        d1,d2;
    var slashCode = '%2F';

    function newPattern(pattern) {
        return new Pattern(pattern);
    }

    beforeEach(function() {
        d1 = newPattern('firm/:id');
        d2 = newPattern('slu/:alias::id');
    });

    describe("#constructor", function() {
        it("корректно компилирует строки начинающиеся с /", function() {
            newPattern('/:city/123');
            newPattern('/firm/:firm');
        });
    });


    describe("#dataMatch", function() {
        it("правильно определяет соответствие данных", function() {
            assert(d1.dataMatch({'id': 'someId'}), "должен соответствовать по id");
            assert(newPattern('state/:id1/homhom-:id2').dataMatch({
                'id1': 1,
                'id2': 2,
                'dgdsfg': 3
            }), "должен соответствовать по id1 и id2");
        });

        it("даже если данные более избыточны чем шаблон", function() {
            assert(d1.dataMatch({'id': 'someId', 'someOtherParam': 47}));
        });

        it("определяет несоответствие данных", function() {
            assert(!d1.dataMatch({}), "должен фолсить на пустом объекте");
            assert(!d1.dataMatch({'nue': 2}), "должен фолсить на объекте не содержащим нужных ключей");
        });
    });

    describe("#match", function() {
        it("правильно сопостовляет себя строке", function() {
            var r1 = newPattern('query/:query::s/:id').match('query/пиво 5' + slashCode + '1:new/23');
            assert(r1);
            delete r1.string;
            assert.deepEqual(r1, {
                slug: 'query',
                params: {
                    query: 'пиво 5/1',
                    id: 23,
                    s: 'new'
                },
                index: 0
            });
        });

        it("правильно сопостовляет себя строке с дефисом", function() {
            var r1 = newPattern('query-firms/:query::s/:id').match('query-firms/пиво 5' + slashCode + '1:new/23');
            assert(r1);
            delete r1.string;
            assert.deepEqual(r1, {
                slug: 'query-firms',
                params: {
                    query: 'пиво 5/1',
                    id: 23,
                    s: 'new'
                },
                index: 0
            });
        });
    });

    describe("#inject", function() {
        it("правильно сериализует переданные данные в паттерн", function() {
            var r1 = newPattern('query/:query::s/:id').inject({
                query: 'пиво 5/1',
                s: 'new',
                id: '456dgfdsghdfgh'
            });

            assert.equal(decodeURIComponent(r1), 'query/пиво 5/1:new/456dgfdsghdfgh');
        });

        it("правильно сериализует с пропущенным именем филиала", function() {
            var feedbackState = {
                    feedbackType: 'dataError',
                    filialId: '123',
                    filialName: null,
                    filialAddress: 'filialAddress'
                },
                r1 = newPattern('feedback/:feedbackType,:filialId╎:filialName╎:filialAddress').inject(feedbackState);

            assert.equal(decodeURIComponent(r1), 'feedback/dataError,123╎╎filialAddress');
        });

        it("правильно сериализует переданные данные в паттерн", function() {
            var feedbackState = {
                feedbackType: 'dataError',
                filialId: '123',
                filialName: 'filialName',
                filialAddress: null
            };
            var r1 = newPattern('feedback/:feedbackType,:filialId╎:filialName╎:filialAddress').inject(feedbackState);
            assert.equal(decodeURIComponent(r1), 'feedback/dataError,123╎filialName╎');
        });
    });
});