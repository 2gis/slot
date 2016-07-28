var assert = require('assert');

describe('stuff', function() {
    var stuff = require('../stuff');

    describe('extendQuery', function() {
        var extendQuery = stuff.extendQuery;

        it('новые параметры добавляются', function() {
            var newUrl = 'https://www.search.ru/?q=beer';
            var oldUrl = 'https://www.search.ru/';

            assert.equal(extendQuery(newUrl, oldUrl), 'https://www.search.ru/?q=beer');
        });

        it('если параметров нет в новом УРЛе, то они остаются от старого', function() {
            var newUrl = 'https://www.search.ru/?q=beer';
            var oldUrl = 'https://www.search.ru/?r=whiskey';

            assert.equal(extendQuery(newUrl, oldUrl), 'https://www.search.ru/?r=whiskey&q=beer');
        });

        it('если параметр есть и там, и там, берется новое значение', function() {
            var newUrl = 'https://www.search.ru/?q=beer';
            var oldUrl = 'https://www.search.ru/?q=whiskey';

            assert.equal(extendQuery(newUrl, oldUrl), 'https://www.search.ru/?q=beer');
        });

        it('прочие части нового УРЛа остаются неизменными', function() {
            var newUrl = 'https://www.search.ru/?q=beer';
            var oldUrl = 'http://another.ru/search/?q=beer';

            assert.equal(extendQuery(newUrl, oldUrl), 'https://www.search.ru/?q=beer');
        });

        it('обязательный для семны параметр стирается', function() {
            var newUrl = 'https://www.search.ru/';
            var oldUrl = 'https://www.search.ru/?q=beer';

            assert.equal(extendQuery(newUrl, oldUrl, 'q'), 'https://www.search.ru/');
        });

    });

});
