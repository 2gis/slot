var env = require('./env'),
    _ = require('lodash');

var config = typeof window == 'undefined' ? env.requirePrivate('config') : {};

module.exports = config;

module.exports.group = function(groupName) {
    var groupConfig = {};

    for (var key in config) {
        if (config.hasOwnProperty(key) && key.startsWith(groupName + '.')) {
            var groupKey = key.substr(groupName.length + 1);
            groupConfig[groupKey] = config[key];
        }
    }

    return groupConfig;
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

            var origin = config[key];
            if (doPush && key in config && _.isArray(origin)) {
                origin.push.apply(origin, value);
            } else {
                config[key] = value;
            }
        }
    }
};
