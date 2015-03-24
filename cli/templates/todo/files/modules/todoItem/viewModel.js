var _ = require('lodash');

module.exports = function(model) {
    var vm = _.clone(model);

    return vm;
};