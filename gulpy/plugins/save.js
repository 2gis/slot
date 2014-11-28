
var fs = require('fs');
var through = require('through2');
var mkdirp = require('mkdirp');

/**
 * Сохраняет файл прям по месту прописки.
 * Не следует применять этот плагин если у файлов путь не менялся - т.к.
 *  получится ситуация что откуда читаем - туда же и пишем, так делать не стоит.
 * @returns {*}
 */
function save() {
    return through.obj(function(file, enc, cb) {
        function done(err) {
            cb(err, file);
        }

        if (file.isDirectory()) {
            mkdirp(file.path, done);
            return;
        }

        if (file.isNull()) return done(null);

        var opt = {};
        if (file.stat && file.stat.mode != null) {
            opt.mode = file.stat.mode;
        }
        if (file.isStream()) {
            var outStream = fs.createWriteStream(file.path, opt);
            file.contents = file.contents.pipe(outStream);
            done(null);
        }
        if (file.isBuffer()) {
            fs.writeFile(file.path, file.contents, opt, done);
        }
    });
}

module.exports = save;