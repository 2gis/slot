var _ = require('lodash');
var utils = require('./utils');

module.exports = function(pot, appOptions) {
    var babel = require('./utils/babel')(pot);

    return function(cb) {
        var defaultOption = {
            src: './l10n/messages.pot',
            dest: './l10n'
        };
        var option = _.defaults(appOptions, defaultOption);
        utils.prepareFiles(option.src);
        utils.prepareFiles(option.dest);

        babel(utils.opts(_.extend(option, {
            command: 'init'
        }), pot), cb);
    };
};