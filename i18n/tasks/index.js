var _ = require('lodash');

module.exports = function(pot) {
    return {
        extract: _.partial(require('./extract'), pot),
        init: _.partial(require('./init'), pot),
        po2json: _.partial(require('./po2json'), pot),
        update: _.partial(require('./update'), pot)
    };
};
