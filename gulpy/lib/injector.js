var through = require('through2');

/**
 * Возвращает код для вставки в конец файла или null
 *
 * @param {String|Buffer} src
 * @returns {string|null}
 */
function getInjectCode(src) {
    var injector = require('../../lib/injector');

    var args = injector.getArgs(src.toString());
    var writeInject = args && args.length && args.some(function(arg) {
        return arg.charAt(0) == '$';
    });
    if (writeInject) {
        return 'module.exports._args = ' + JSON.stringify(args) + ';';
    }
}

/**
 * Добавление аннотаций перед sourcemap
 * Нужно на случай, если аннотируемый код уже был пропущен
 * через некоторый препроцессор, генерирующий сайтмапы (babel, tsc, etc)
 */
function injectBeforeSourcemap(code, injectText) {
    if (!injectText) {
        return code;
    }

    var sourcemapSeparator = '//# sourceMappingURL=';
    code = code.split(sourcemapSeparator);
    code[0] += injectText + '\n';
    return code.join(sourcemapSeparator);
}

/**
 * Поток для аннотирования
 * @returns {Stream}
 */
function injectStream() {
    var buf = '';

    return through(function(chunk, enc, callback) {
        buf += chunk.toString();
        callback();
    }, function(done) {
        this.push(injectBeforeSourcemap(buf, getInjectCode(buf)));
        buf = '';
        done();
    });
}

exports.getInjectCode = getInjectCode;
exports.injectStream = injectStream;

