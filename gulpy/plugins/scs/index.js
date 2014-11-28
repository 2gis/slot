
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var checker = require('./checker');

function resolveReporter(ref, def) {
    if (!ref) ref = def;

    if (typeof ref == 'function') {
        return ref;
    }
    if (ref.indexOf('/') == -1) {
        return require('./reporters/' + ref);
    }

    return require(ref);
}

function reporter(ref) {
    var report = resolveReporter(ref, 'simple');

    return through.obj(function(file, enc, cb) {
        if (file.scs && !file.scs.success) {
            report(file.scs.relative, file.scs.errors);
        }
        cb(null, file);
    });
}

function scs(options) {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) return cb(null, file);

        if (file.isStream()) {
            return cb(new gutil.PluginError('gulp-scs', "Streams not supported"));
        }

        var relpath = path.relative(process.cwd(), file.path);
        var errors = checker(relpath, file.contents, options);

        file.scs = {
            success: errors.length == 0,
            errors: errors,
            relative: relpath // file.relative is buggy in gulp
        };

        if (!file.scs.success) {
            this.emit('scs.failed', file);
        }

        cb(null, file);
    });
}

module.exports = scs;
module.exports.reporter = reporter;