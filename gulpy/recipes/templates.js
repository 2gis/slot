
var _ = require('lodash');
var es = require('event-stream');
var templatify = require('../snippets/templatify');

var modulesPaths = ['blocks/**/*.html', 'modules/**/*.html'];
var modules = {
    globs: modulesPaths,
    compile: function(opts) {
        opts = _.defaults(opts || {}, {
            namespace: 'jst_modules',
            parentBased: ['blocks', 'modules']
        });
        return templatify(modulesPaths, opts);
    }
};

var helpersPaths = ['helpers/blocks/**/*.html'];
var helpers = {
    globs: helpersPaths,
    compile: function(opts) {
        opts = _.defaults(opts || {}, {
            namespace: 'jst_helpers'
        });
        return templatify(helpersPaths, opts);
    }
};

exports.globs = function() {
    return modulesPaths.concat(helpersPaths);
};

exports.compile = function(opts) {
    return es.merge(
        modules.compile(opts),
        helpers.compile(opts)
    );
};

exports.modules = modules;
exports.helpers = helpers;
