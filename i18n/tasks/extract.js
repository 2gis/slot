var _ = require('lodash');
var utils = require('./utils');
var path = require('path');

module.exports = function(pot, appOptions) {
    var babel = require('./utils/babel')(pot);

    return function(cb) {
        var defaultOption = {
            src: [
                'blocks/',
                'components/',
                'helpers/',
                'modules/'
            ],
            dest: './l10n/messages.pot',
            keyword:  [ '_t', '_nt:1,3', '_pt:1c,2', '_npt:1c,2,4', '_ht', '_hnt:1,3'],
            mapping: path.join(__dirname, 'extractors', 'babel.cfg'),
            'add-comments': ['";"'],
            'width': 160,
            'sort-output': true,
            'no-default-keywords': true,
            'strip-comment-tags': true,
            'no-location': true,
            'msgid-bugs-address': '',
            'copyright-holder': ''
        };
        var option = _.defaults(appOptions, defaultOption);
        option.src = utils.checkFiles(option.src);
        utils.prepareFiles(option.dest);

        babel(utils.opts(_.extend(option, {
            command: 'extract'
        }), pot), cb);
    };
};