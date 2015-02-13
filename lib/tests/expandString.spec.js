
var assert = require('assert');
var expand = require('../expandString');

describe('expandString', function() {
    it('просто строку возвращает как есть', function() {
        assert.deepEqual(expand('/foo'), [
            '/foo'
        ]);
    });

    it('не должен терять слэши в начале строки', function() {
        assert.deepEqual(expand('/city/:city/[page/:page]'), [
            '/city/:city/page/:page',
            '/city/:city'
        ]);
    });

    it('очень простой пример', function() {
        assert.deepEqual(expand('foo/[:id]'), [
            'foo/:id',
            'foo'
        ]);
    });

    it("простой пример", function() {
        assert.deepEqual(expand('foo/[:ab]/[firms/:id]'), [
            'foo/:ab/firms/:id',
            'foo/:ab',
            'foo/firms/:id',
            'foo'
        ]);
    });

    it('слэш внутри опциона (нежелательно, но работать должно)', function() {
        assert.deepEqual(expand('foo/[:ab/][firms/:id]'), [
            'foo/:ab/firms/:id',
            'foo/:ab',
            'foo/firms/:id',
            'foo'
        ]);
    });

    it('пример из трех опционов', function() {
        assert.deepEqual(expand('foo/[id/:id]/[ab/:page]/[filters/:text]'), [
            'foo/id/:id/ab/:page/filters/:text',
            'foo/id/:id/ab/:page',
            'foo/id/:id/filters/:text',
            'foo/id/:id',
            'foo/ab/:page/filters/:text',
            'foo/ab/:page',
            'foo/filters/:text',
            'foo'
        ]);
    });
});
