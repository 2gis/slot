
var path = require('path');

var env = require('../env');
env.setRootPath(path.join(__dirname, '..'));

var config = require('../config');
var appConstructor = require('../serverApp');

module.exports = function() {
    var app = appConstructor(config);
    var slotConstructor = require('../slot');

    return {
        app: app,
        slot: slotConstructor(app, {
            moduleId: 'super_random_id'
        })
    };
};
