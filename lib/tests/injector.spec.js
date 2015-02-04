
var fs = require('fs');
var path = require('path');
var assert = require('assert');

describe('injector', function() {

    var injector = require('../injector');

    it('foo', function() {
        var foo = fs.readFileSync(path.join(__dirname, 'data/foo.js')).toString();
        var annotated = injector.annotateComponent(foo);

        assert.deepEqual(annotated, ['app']);
    });

    it('anonymous func', function() {
        var anonym = fs.readFileSync(path.join(__dirname, 'data/anonym.js')).toString();
        var annotated = injector.annotateComponent(anonym);

        assert.deepEqual(annotated, ['app', '$ast']);
    });
});