
var _ = require('lodash');
var fs = require('fs');
var glob = require('flat-glob').sync;
var through = require('through2');
var async = require('async');

function mtime(stat) {
    return stat && stat.mtime;
}

/**
 * Проверяет изменились ли одна группа файлов относительно другой
 * @param {String[]} src массив исходных файлов
 * @param {String[]} dest массив получаемых файлов
 * @param done
 */
function checkChanged(src, dest, done) {

    function checkDest(cb) {
        async.map(dest, fs.stat, function(err, stats) {
            if (err) {
                cb(true);
            } else {
                cb(null, _.min(stats.map(mtime)));
            }
        });
    }

    function checkSrc(cb) {
        async.map(glob(src), function(item, cb) {
            fs.stat(item, function(err, stat) {
                cb(null, stat || 0);
            });
        }, function(err, stats) {
            if (err) {
                cb(true);
            } else {
                cb(null, _.max(stats.map(mtime)));
            }
        });
    }

    async.series([checkDest, checkSrc], function(err, mtimes) {
        if (err) return done(true);
        done(mtimes[0] < mtimes[1]);
    });
}

function newerStream(src, dest, makeStream) {
    var stream = through.obj();

    checkChanged(src, dest, function(needInvalidate) {
        return makeStream(needInvalidate).pipe(stream);
    });

    return stream;
}

module.exports = newerStream;