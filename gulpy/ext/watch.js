var events = require('events');
var globule = require('globule');
var chokidar = require('chokidar');

function watch(patterns, opts, cb) {
    var emitter = new events.EventEmitter();
    emitter.setMaxListeners(15);

    var files = globule.find(patterns);
    var watcher = chokidar.watch(files, opts);

    watcher.on('all', function(type, path) {
        var event = {
            type: type,
            path: path
        };
        emitter.emit('change', event);
        if (cb) cb(event);
    });
    watcher.on('error', emitter.emit.bind(emitter, 'error'));

    emitter.end = watcher.close.bind(watcher);
    emitter.close = emitter.end;
    emitter.add = watcher.add.bind(watcher);

    return emitter;
}

module.exports = function(pot) {
    var gulp = pot.gulp;

    return function(glob, opt, fn) {
        if (typeof opt == 'function' || Array.isArray(opt)) {
            fn = opt;
            opt = null;
        }
        opt = opt || {};
        opt.persistent = true;
        opt.ignoreInitial = true;
        opt.interval = process.env['WATCH_INTERVAL'] || 900;
        opt.binaryInterval = process.env['WATCH_BIN_INTERVAL'] || 2500;

        // array of tasks given
        if (Array.isArray(fn)) {
            return watch(glob, opt, function() {
                gulp.start.apply(gulp, fn);
            });
        }

        return watch(glob, opt, fn);
    };
};
