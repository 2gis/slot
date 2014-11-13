
var _ = require('lodash');
var path = require('path');

/**
 * basename without ext
 */
function basename(filepath) {
    return path.basename(filepath, path.extname(filepath));
}
exports.basename = basename;

/**
 * basename with parents dirs
 * @param filepath
 * @param {number} [count=1] count of parent folders to include
 */
exports.parentDir = function(filepath, count) {
    count = count || 1;

    var parts = filepath.split(path.sep);
    var len = parts.length;
    parts[len - 1] = basename(parts[len - 1]);

    return parts.slice(-count - 1).join(path.sep);
};

exports.parentBased = function(stopwords, filepath) {
    var parts = filepath.split(path.sep);
    var dirs = parts.slice(0, -1);

    var foundIndex;

    for (var len = dirs.length, i = len - 2; i >= 0; i--) {
        var dirname = dirs[i];
        if (_.contains(stopwords, dirname)) {
            foundIndex = i + 1;
            break;
        }
    }

    var result = basename(filepath);
    if (foundIndex != null) {
        result = dirs[foundIndex] + '.' + result;
    }
    return result;
};