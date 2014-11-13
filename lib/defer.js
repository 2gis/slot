/**
 * @module defer
 */

var _ = require('lodash'),
    env = require('../env');

module.exports = (function() {
    var $ = env.isClient ? jQuery : require('jquery-deferred');

    function defer() {
        var d = $.Deferred();
        d.toCallback = _.partial(defer.toCallback, d);
        return d;
    }

    defer.when = function() {
        var args = _.compact(_.flatten(arguments, true));
        var promise = $.when.apply($, args);
        promise.nodeify = _.partial(defer.nodeify, promise);
        return promise;
    };

    defer.nodeify = function(promise, callback, self) {
        return promise.then(function() {
            var args = [].slice.call(arguments);
            args = [null].concat(args);
            callback.apply(self, args);
        }, function(error) {
            callback(error);
        });
    };

    defer.toCallback = function(defer) {
        return function(err) {
            var args = [].slice.call(arguments, 1);
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve.apply(defer, args);
            }
        };
    };

    return defer;
})();
