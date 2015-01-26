var _ = require('lodash');
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

exports.opts = function(o, pot) {
    var runBabel = path.join(path.dirname(__dirname), 'extractors', 'run_babel.py');
    return _.defaults(o, {
        executable: 'python ' + runBabel,
        locale: pot.args.locale,
        verbose: pot.args.verbose
    });
};

exports.prepareFiles = function(files) {
    files = _.isArray(files) ? files : [files];

    _.each(files, function(filePath) {
        if (!fs.existsSync(filePath)) {
            wrench.mkdirSyncRecursive(path.dirname(filePath));
            fs.writeFileSync(filePath);
        }
    });
};

exports.checkFiles = function(files) {
    files = _.isArray(files) ? files : [files];

    return _.filter(files, function(path) {
        return fs.existsSync(path);
    });
};