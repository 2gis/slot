var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var glob = require('flat-glob').sync;
var through = require('through2');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');

function mtime(stat) {
    return stat && stat.mtime;
}

function getMtimes(sources, cb) {
    async.map(sources, function(item, cb) {
        fs.stat(item, function(err, stat) {
            cb(err, stat || 0);
        });
    }, function(err, stats) {
        cb(err, !err && stats.map(mtime));
    });
}

function checkChanged(sources, dests, done) {

    var allFiles = sources.concat(dests);

    getMtimes(allFiles, function(err, mtimes) {
        if (err) return done(err);

        var shasum = crypto.createHash('sha1');
        shasum.update(allFiles.join());
        var namesHash = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(mtimes.join());
        var changesHash = shasum.digest('hex');

        done(null, namesHash, changesHash);
    });
}

var cache = {
    path: 'build/cache/changed',
    getPath: function(namesHash) {
        mkdirp.sync(cache.path);

        return path.join(cache.path, namesHash);
    },
    read: function(namesHash, cb) {
        var fn = cache.getPath(namesHash);

        fs.readFile(fn, 'utf8', cb);
    },

    write: function(namesHash, changesHash) {
        var fn = cache.getPath(namesHash);

        fs.writeFileSync(fn, changesHash);
    }
};

/**
 * Проверяет соответствие кэша фактическим файлам по сумме mtime исходником и имен пунктов назначения
 * @param {String[]} srcs массив масок исходных файлов
 * @param {String[]} dests массив получаемых файлов
 * @param makeStream колбек возвращающий что-то типа типа gulp.src()
 */
module.exports = function(srcs, dests, makeStream) {
    var stream = through.obj();
    srcs = glob(srcs);

    function finish(needInvalidate) {
        return makeStream(needInvalidate)
            .on('finish', function() {
                if (!needInvalidate) return;

                checkChanged(srcs, dests, function(err, namesHash, changesHash) {
                    if (err) return stream.emit('error', err);

                    cache.write(namesHash, changesHash);
                });
            })
            .pipe(stream);
    }

    checkChanged(srcs, dests, function(err, namesHash, changesHash) {
        // если нет каких-то файлов - значит нужно инвалидировать
        if (err) return finish(true);

        // иначе инвалидируем только при необходимости
        cache.read(namesHash, function(err, data) {
            var needInvalidate = !!err || data != changesHash;

            return finish(needInvalidate);
        });
    });

    return stream;
};