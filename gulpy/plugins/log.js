
var through = require('through2');

module.exports = function(msg) {
    return through.obj(function(file, enc, cb) {
        console.log(msg, file.path);
        cb(null, file);
    });
};