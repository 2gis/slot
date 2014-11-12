var sinon = require('sinon'),
    assert = require('assert');

describe("компонент defer", function() {

    var defer = require('../lib/defer');

    it("работает nodeify", function() {
        var callback = sinon.spy();

        var value = {x: 1};

        var d = defer();
        defer.nodeify(d, callback);
        d.resolve(value);
        assert(callback.calledWith(null, value));
    });

    it("работает nodeify c when(null)", function() {
        var callback = sinon.spy();
        var value = {x: 1};

        defer.when(value).nodeify(callback);

        assert(callback.calledOnce);
        assert(callback.calledWithExactly(null, value));
    });

    it("работает nodeify c when(promise)", function() {
        var d = defer();
        var callback = sinon.spy();
        var value = {x: 1};

        defer.when(d.promise()).nodeify(callback);

        d.resolve(value);

        assert(callback.calledOnce);
        assert(callback.calledWithExactly(null, value));
    });

    it("работает toCallback в режиме done", function() {
        var d = defer();
        var callback = d.toCallback();

        var doneSpy = sinon.spy(),
            failSpy = sinon.spy();

        d.promise().then(doneSpy, failSpy);
        callback();

        assert(doneSpy.calledOnce);
        assert(doneSpy.calledWithExactly());
        assert.equal(failSpy.callCount, 0);
    });

    it("работает toCallback в режиме fail", function() {
        var d = defer();
        var callback = d.toCallback();

        var doneSpy = sinon.spy(),
            failSpy = sinon.spy();

        d.promise().then(doneSpy, failSpy);
        callback(1);

        assert(failSpy.calledOnce);
        assert(failSpy.calledWithExactly(1));
        assert.equal(doneSpy.callCount, 0);
    });
});