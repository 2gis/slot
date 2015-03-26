var fs = require('fs');
var path = require('path');

module.exports = {
    name: 'basic',
    type: 'app',
    description: 'A basic Hello World Slot.js app. Installs by default',
    postInstall: function(dest, callback) {
        fs.mkdirSync(path.join(dest, '/plugins'));
        fs.mkdirSync(path.join(dest, '/public'));
        callback();
    }
};
