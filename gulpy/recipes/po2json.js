
var gulp = require('gulp');
var po2json = require('../plugins/po2json');
var save = require('../plugins/save');

var globs = 'l10n/*/**/*.po';

function compile(options) {
    return gulp.src(options.globPath || globs)
        .pipe(po2json(options))
        .pipe(save());
}

exports.compile = compile;
exports.globs = globs;
