var fs = require('fs');
var path = require('path');

module.exports = {
    name: 'module',
    type: 'part',
    description: 'Empty module for Slot application',
    postInstall: function(dest, callback) {
        var moduleName = path.basename(dest);

        fs.renameSync(
            path.join(dest, 'moduleName.html'),
            path.join(dest, moduleName + '.html')
        );
        fs.renameSync(
            path.join(dest, 'moduleName.js'),
            path.join(dest, moduleName + '.js')
        );
        fs.renameSync(
            path.join(dest, 'moduleName.less'),
            path.join(dest, moduleName + '.less')
        );

        callback();
    }
};
