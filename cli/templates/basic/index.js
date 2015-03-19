var fs = require('fs');
var path = require('path');
var ncp = require('ncp').ncp;

module.exports = {
    name: 'basic',
    description: 'A basic Hello World Slot.js app',
    postInstall: function(dest, callback) {
        fs.mkdirSync(path.join(dest, '/components'));
        fs.mkdirSync(path.join(dest, '/public'));
        callback();
    }
};
