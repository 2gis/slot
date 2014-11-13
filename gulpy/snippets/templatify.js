
var _ = require('lodash');
var gulp = require('gulp');
var modified = require('gulp-modified');
var remember = require('gulp-remember');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var renamers = require('../lib/renamers');
var handlebarsify = require('../plugins/handlebarsify');

const DEST = 'build/private/';

function templatify(streamOrPaths, declOpts, name) {
    name = name || declOpts.namespace;

    var stream = streamOrPaths.pipe ? streamOrPaths : gulp.src(streamOrPaths);

    var renamer = declOpts.parentBased ?
        _.partial(renamers.parentBased, declOpts.parentBased)
        : renamers.basename;

    return stream
        .pipe(modified('js'))
        .pipe(handlebarsify())
        .pipe(declare({
            namespace: declOpts.namespace,
            processName: renamer
        }))
        .pipe(remember('templates.' + name))
        .pipe(concat(name + '.js'))
        .pipe(gulp.dest(DEST));
}

module.exports = templatify;