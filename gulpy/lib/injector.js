
var through = require('through2');

/**
 * Возвращает код для вставки в конец файла или null
 *
 * @param {String|Buffer} src
 * @returns {string|null}
 */
function getInjectCode(src) {
    var injector = require('slot/lib/injector');
    var args = injector.getArgs(src.toString());
    var writeInject = args && args.length && args.some(function(arg) {
        return arg.charAt(0) == '$';
    });
    if (writeInject) {
        return 'module.exports._args = ' + JSON.stringify(args) + ';';
    }
}

/**
 * Поток для аннотирования
 * @returns {Stream}
 */
function injectStream() {
    var buf = '';

    return through(function(chunk, enc, callback) {
        buf += chunk.toString();
        callback(null, chunk);
    }, function(done) {
        var injectText = getInjectCode(buf);
        if (injectText) {
            this.push(injectText);
        }
        done();
    });
}

exports.getInjectCode = getInjectCode;
exports.injectStream = injectStream;