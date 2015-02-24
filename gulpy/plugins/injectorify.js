
/*
 Аннотирует компоненты и модули конструкцией _args для последующей работы инжектора в релизной сборке
 */

var through = require('through2');
var injector = require('../lib/injector');

/**
 * Плагин для галпа
 * @returns {*}
 */
function injectorify() {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file); // Do nothing if no contents
        }

        if (file.isBuffer()) {
            var injectCode = injector.getInjectCode(file.contents);
            if (injectCode) {
                var injectCodeBuffer = Buffer(injectCode);
                file.contents = Buffer.concat([file.contents, injectCodeBuffer], file.contents.length + injectCodeBuffer.length);
            }
            return cb(null, file);
        }

        if (file.isStream()) {
            var streamer = injector.injectStream();
            streamer.on('error', this.emit.bind(this, 'error'));
            file.contents = file.contents.pipe(streamer);
            return cb(null, file);
        }
    });
}

module.exports = injectorify;