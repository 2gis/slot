/**
 * @module config
 */

var env = require('./env');

var cfg = env.getConfig();
module.exports = cfg;

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
