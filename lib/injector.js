/**
 * @module injector
 *
 * @description
 * Реализация паттерна dependency injector.
 *
 * Аннотируется только методы с аргументами начинающимися на $.
 */

var _ = require('lodash');

var FN_ARGS = /function\s*[^\(]*\(\s*([^\)]*)\)/mg;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(\S+?)\s*$/;
var FN_DEP_ARG = /\$\S+/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * Выбирает ту функцию в которой есть аргументы с именем начинающиеся на $.
 *
 * @returns {array?} Возвращает match объект аргументов выбранной функции, первый group - аргументы
 * @private
 */
function matchDepArgs(src) {
    src = src.replace(STRIP_COMMENTS, '');

    var fnArgsRe = _.clone(FN_ARGS),
        match;

    while (match = fnArgsRe.exec(src)) {
        if (FN_DEP_ARG.test(match[1])) {
            return match;
        }
    }
}

/**
 * Возвращает список аргументов для модуля/функции
 *
 * @returns {string[]|null}
 */
function getArgs(src) {
    var match = matchDepArgs(src);

    if (match) {
        var args = [];
        _.each(match[1].split(FN_ARG_SPLIT), function(arg) {
            arg.replace(FN_ARG, function(all, name) {
                args.push(name);
            });
        });
        return args;
    }
    return null;
}


/**
 * Аннотирует функцию c помощью метода getArgs
 *
 * @memberof module:injector
 *
 * @param {Function|Array} fn
 * @returns {*}
 */
function annotate(fn) {
    if (typeof fn != 'function') {
        throw new TypeError("injector.annotate: fn must be a function");
    }

    if (fn._args === void 0) {
        fn._args = getArgs(fn.toString());
    }
    return fn._args;
}

/**
 * Вызывает функцию, подставляя необходимые значения в аргументы.
 *
 * @memberof module:injector
 *
 * @param {Function} fn - Функция для вызова.
 * @param {Array} simpleArgs - Значения "простых" аргументов, которые не нужно особым образом получать.
 * @param {Function} provider - Провайдер значений для аннотированных аргументов.
 * @param {Object} self - Контекст выполнения для функции.
 * @returns {*} Результат вызова функции fn.
 */
function invoke(fn, simpleArgs, provider, self) {
    if (typeof fn != 'function') {
        throw new TypeError("injector.invoke: fn must be a function, got" + fn);
    }
    var depArgs = annotate(fn);

    if (depArgs == null) {
        return fn.apply(self, simpleArgs);
    }

    var args = [],
        simpleIndex = 0;

    for (var i = 0, len = depArgs.length; i < len; i++) {
        var name = depArgs[i];
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

exports.getArgs = getArgs;

exports.annotate = annotate;
exports.invoke = invoke;
