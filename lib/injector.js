/**
 * @module injector
 *
 * @description
 * Если в файле есть функция вида вида module.exports = function(..) инжектор аннотируюет именно её,
 * в противном случае берется первая функция в файле.
 */

var _ = require('lodash');

var EXPORTS_FN_ARGS = /module\.exports\s*=\s*function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARGS = /function\s*[^\(]*\(\s*([^\)]*)\)/mg;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * @private
 */
function getArgsDecl(src) {
    src = src.replace(STRIP_COMMENTS, '');

    if (EXPORTS_FN_ARGS.test(src)) {
        var exportsFnRe = _.clone(EXPORTS_FN_ARGS);

        return exportsFnRe.exec(src);
    }

    return _.clone(FN_ARGS).exec(src);
}

/**
 * @private
 */
function getArgs(src) {
    var $inject = [];
    var argDecl = getArgsDecl(src);

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
 * Возвращает аргументы к аннотированию для компонента.
 *
 * @memberOf module:injector
 *
 * @param {string} src - Код компонента.
 * @returns {*}
 */
function annotateComponent(src) {
    return getArgs(src);
}

/**
 * Аннотирует функцию.
 *
 * @memberOf module:injector
 *
 * @param {Function|Array} fn
 * @returns {*}
 */
function annotate(fn) {
    var $inject,
        last;

    if (typeof fn == 'function') {
        if (!($inject = fn.$inject)) {
            $inject = fn.$inject = getArgs(fn.toString());
        }
    } else if (_.isArray(fn)) {
        last = fn.length - 1;
        $inject = fn.slice(0, last);
    }
    return $inject;
}

/**
 * Вызывает функцию, подставляя необходимые значения в аргументы.
 *
 * @memberOf module:injector
 *
 * @param {Function} fn - Функция для вызова.
 * @param {Array} simpleArgs - Значения "простых" аргументов, которые не нужно особым образом получать.
 * @param {Function} provider - Провайдер значений для аннотированных аргументов.
 * @param {Object} self - Контекст выполнения для функции.
 * @returns {*} Результат вызова функции fn.
 */
function invoke(fn, simpleArgs, provider, self) {
    if (typeof fn != 'function') {
        throw new TypeError("injector.invoke: fn must be a function");
    }
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
