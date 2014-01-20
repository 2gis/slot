
var _ = require('underscore');

var COMPONENT_ARGS = /module\.exports\s*=\s*function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getArgs(src, argsRe) {
    var $inject = [];
    src = src.replace(STRIP_COMMENTS, '');
    var argDecl = src.match(argsRe);

    _.each(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
        arg.replace(FN_ARG, function(all, underscore, name){
            $inject.push(name);
        });
    });

    return $inject;
}

function annotateComponent(src) {
    return getArgs(src, COMPONENT_ARGS);
}

function annotate(fn) {
    var $inject,
        last;

    if (typeof fn == 'function') {
        if (!($inject = fn.$inject)) {
            $inject = fn.$inject = getArgs(fn.toString(), FN_ARGS);
        }
    } else if (_.isArray(fn)) {
        last = fn.length - 1;
        $inject = fn.slice(0, last);
    }
    return $inject;
}

function invoke(fn, simpleArgs, provider, self) {
    var $inject = annotate(fn);
    var args = [],
        simpleIndex = 0;
    for (var i = 0, len = $inject.length; i < len; i++) {
        var name = $inject[i];
        var value;
        if (name.charAt(0) == '$') {
            value = provider(name.substr(1));
        } else {
            value = simpleArgs[simpleIndex++];
        }
        args.push(value);
    }

    return fn.apply(self, args);
}

exports.annotateComponent = annotateComponent;
exports.annotate = annotate;
exports.invoke = invoke;