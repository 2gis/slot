
var fs = require('fs');
var path = require('path');

var jsFileRe = /\.js(on)?$/;

/**
 * Require files from directory
 * @param {String} path cwd'based path
 */
module.exports = function(dirpath, opts) {
    opts = opts || {};

    var dir = {};
    var files = fs.readdirSync(dirpath);
    files.forEach(function(name) {
        var filepath = path.join(dirpath, name);
        var stats = fs.lstatSync(filepath);

        var isValidFile = (jsFileRe.test(name) && stats.isFile());
        var isValidDir = (stats.isDirectory() && fs.existsSync(path.join(filepath, 'index.js')));
        if ((isValidFile || isValidDir) && (!opts.filter || opts.filter(filepath))) {
            var basename = path.basename(name, path.extname(name));
            var relpath = path.relative(__dirname, dirpath);
            dir[basename] = require(path.join(relpath, name));
        }
    });

    return dir;
};
