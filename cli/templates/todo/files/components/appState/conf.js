var _ = require('lodash');

exports.urls = {
    'filter/:type': 'inject'
};

exports.validatorsMap = {
    'filter/type': function(type) {
        var allowedTypes = [
            'active',
            'completed'
        ];

        return _.contains(allowedTypes, type);
    }
};
