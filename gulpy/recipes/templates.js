
var _ = require('lodash');
var es = require('event-stream');
var templatify = require('../snippets/templatify');
var concat = require('gulp-concat');

var modulesPaths = ['blocks/**/*.html', 'modules/**/*.html'];
var modules = {
    globs: modulesPaths,
    compile: _.partial(templatify, modulesPaths, {
        namespace: 'jst_modules',
        parentBased: ['blocks', 'modules']
    })
};

var helpersPaths = ['helpers/blocks/**/*.html'];
var helpers = {
    globs: helpersPaths,
    compile: _.partial(templatify, helpersPaths, {
        namespace: 'jst_helpers'
    })
};

exports.globs = function() {
    return modulesPaths.concat(helpersPaths);
};

exports.compile = function(outputPath) {
    return es.merge(
        modules.compile(null, outputPath),
        helpers.compile(null, outputPath)
    ).pipe(concat('templates.js'));
};

exports.modules = modules;
exports.helpers = helpers;
