
/*
 * Расширение platform для пота
 */

module.exports = function(pot) {
    var names = ['phone', 'tablet', 'ie8', 'ie9'];

    var platform = {};

    var targets = [];
    names.map(function(name) {
        if (pot.args[name]) {
            platform[name] = true;
        }
    });

    var touch = pot.args.touch;
    var ie = pot.args.ie;

    if (pot.args.all) {
        touch = ie = true;
    }

    if (touch) {
        platform.phone = platform.tablet = true;
    }

    if (ie) {
        platform.ie8 = platform.ie9 = true;
    }

    for (var key in platform) {
        if (!platform.hasOwnProperty(key)) continue;

        targets.push(key);
    }
    platform.targets = targets;

    Object.defineProperty(platform, 'ie', {
        get: function() {
            return this.ie8 || this.ie9;
        }
    });

    return platform;
};