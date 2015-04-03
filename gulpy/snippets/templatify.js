
var _ = require('lodash');
var gulp = require('gulp');
var modified = require('gulp-modified');
var remember = require('gulp-remember');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var renamers = require('../lib/renamers');
var handlebarsify = require('../plugins/handlebarsify');

const DEST = 'build/private/';

function templatify(streamOrPaths, opts, name) {
    name = name || opts.namespace;

    var stream = streamOrPaths.pipe ? streamOrPaths : gulp.src(streamOrPaths);

    var renamer = opts.parentBased ?
        _.partial(renamers.parentBased, opts.parentBased)
        : renamers.basename;

    var handlebarsOpts = _.omit(opts, 'parentBased', 'namespace');

    return stream
        .pipe(modified('js'))
        .pipe(handlebarsify(handlebarsOpts))
        .pipe(declare({
            namespace: opts.namespace,
            processName: renamer
        }))
        .pipe(remember('templates.' + name))
        .pipe(concat(name + '.js'))
        .pipe(gulp.dest(DEST));
}

module.exports = templatify;