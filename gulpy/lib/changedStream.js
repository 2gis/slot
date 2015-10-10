var fs = require('fs');
var path = require('path');
var glob = require('flat-glob').sync;
var through = require('through2');
var async = require('async');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

function mtime(stat) {
    return stat && stat.mtime;
}

function getMtimes(sources, cb) {
    async.map(sources, function(item, cb) {
        fs.stat(item, function(err, stat) {
            cb(null, stat || 0);
        });
    }, function(err, stats) {
        cb(null, stats.map(mtime));
    });
}

function checkChanged(sources, dests, done) {

    var allFiles = sources.concat(dests);

    getMtimes(allFiles, function(err, mtimes) {
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
 * Сопоставляет одну группу файлов к другой и вызывает коллбэк makeStream с результатом соответствия
 * хэш-суммы имен файлов к сохраненной хэш-сумме времен модификации файлов.
 *
 * @param {String[]} srcs массив масок исходных файлов
 * @param {String[]} dests массив получаемых файлов
 * @param makeStream коллбек возвращающий поток который обязан записать dests файлы при необходимости
 */
module.exports = function(srcs, dests, makeStream) {
    var stream = through.obj();
    srcs = glob(srcs);

    function finish(needInvalidate) {
        return makeStream(needInvalidate)
            .on('finish', function() {
                if (!needInvalidate) return;

                checkChanged(srcs, dests, function(err, namesHash, changesHash) {
                    cache.write(namesHash, changesHash);
                });
            })
            .pipe(stream);
    }

    checkChanged(srcs, dests, function(err, namesHash, changesHash) {
        cache.read(namesHash, function(err, data) {
            var needInvalidate = !!err || data != changesHash;

            return finish(needInvalidate);
        });
    });

    return stream;
};
