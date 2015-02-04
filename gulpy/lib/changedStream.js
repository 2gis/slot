var _ = require('lodash');
var fs = require('fs');
var glob = require('flat-glob').sync;
var through = require('through2');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');

function mtime(stat) {
    return stat && stat.mtime;
}

function checkChanged(sources, dests, done) {

    function checkSources(cb) {
        async.map(sources, function(item, cb) {
            fs.stat(item, function(err, stat) {
                cb(null, stat || 0);
            });
        }, function(err, stats) {
            cb(err, !err && stats.map(mtime));
        });
    }

    checkSources(function(err, mtimes) {
        if (err) return done(err);

        var shasum = crypto.createHash('sha1');
        shasum.update(sources.concat(dests).join());
        var namesHash = shasum.digest('hex');

        shasum = crypto.createHash('sha1');
        shasum.update(mtimes.join());
        var changesHash = shasum.digest('hex');

        done(null, namesHash, changesHash);
    });
}

/**
 * Проверяет соответствие кэша фактическим файлам по сумме mtime исходником и имен пунктов назначения
 * @param {String[]} srcs массив масок исходных файлов
 * @param {String[]} dests массив получаемых файлов
 * @param makeStream колбек возвращающий что-то типа типа gulp.src()
 */
module.exports = function(srcs, dests, makeStream) {
    var stream = through.obj();

    checkChanged(glob(srcs), dests, function(err, namesHash, changesHash) {
        if (err) return stream.emit('error', err);

        var fn = 'build/cache/changed/' + namesHash;

        var dirname = path.dirname(fn);
        mkdirp(dirname, function(err) {
            if (err) {
                stream.emit('error', err);
            } else {
                fs.readFile(fn, 'utf8', function(err, data) {
                    var needInvalidate = err || data != changesHash;

                    makeStream(needInvalidate)
                        .on('error', function(err) {
                            fs.unlink(fn, _.noop);
                        })
                        .pipe(stream);

                    if (needInvalidate) {
                        fs.writeFileSync(fn, changesHash);
                    }
                });
            }
        });

    });

    return stream;
};