
/*
 Терминология:

 - Компонент: модуль который имеет в заголовке конструкцию module.exports = function(...)
              и, возможно, содержит аргументы для аннотирования.
              То есть это таже функция, но с обязательным 'module.exports =' в начале
 */

var _ = require('underscore');

var COMPONENT_ARGS = /module\.exports\s*=\s*function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getArgsDecl(src, argsRe) {
    src = src.replace(STRIP_COMMENTS, '');
    return src.match(argsRe);
}

function getArgs(src, argsRe) {
    var $inject = [];
    var argDecl = getArgsDecl(src, argsRe);

    if (argDecl) {
        _.each(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
                $inject.push(name);
            });
        });
    }

    return $inject;
}

/**
 * Возвращает аргументы к аннотированию для компонента
 * @param {String} src код компонента
 * @returns {*}
 */
function annotateComponent(src) {
    return getArgs(src, COMPONENT_ARGS);
}

/**
 * Можно ли аннотировать *компонент*
 * @param {String} src
 * @returns {boolean}
 */
function canAnnotate(src) {
    return !!getArgsDecl(src, COMPONENT_ARGS);
}

/**
 * Аннотирует функцию
 * @param {Function|Array} fn
 * @returns {*}
 */
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

/**
 * Вызывает функцию, подставляя необходимые значения в аргументы
 *
 * @param {Function} fn
 * @param {Array} simpleArgs значения "простых" аргументов, которые не нужно особым образом получать
 * @param {Function} provider провайдер значений для аннотированных аргументов
 * @param {Object} self контекст выполнения для функции
 * @returns {*}
 */
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

exports.canAnnotate = canAnnotate;
exports.annotateComponent = annotateComponent;

exports.annotate = annotate;
exports.invoke = invoke;