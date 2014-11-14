/**
 * @module config
 */

var env = require('./env'),
    _ = require('lodash');

var cfg = typeof window == 'undefined' ? env.requirePrivate('config') : dg.config;

module.exports = cfg;

env.global.DEBUG = cfg.debug;

module.exports.group = function(name) {
    var ret = {};
    for (var key in cfg) {
        if (cfg.hasOwnProperty(key) && key.startsWith(name + '.')) {
            var newKey = key.substr(name.length + 1);
            ret[newKey] = cfg[key];
        }
    }
    return ret;
};

module.exports.merge = function(upstream) {
    for (var key in upstream) {
        if (upstream.hasOwnProperty(key)) {
            var value = upstream[key];
            var doPush = false;
            if (key.charAt(0) == '+') {
                doPush = true;
                key = key.substr(1);
            }

            var origin = cfg[key];
            if (doPush && key in cfg && _.isArray(origin)) {
                origin.push.apply(origin, value);
            } else {
                cfg[key] = value;
            }
        }
    }
};
