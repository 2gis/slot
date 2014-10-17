
var fs = require('fs');
var gulp = require('gulp');
var async = require('async');
var spawn = require('child_process').spawn;
var rimraf = require('rimraf');

var HOOKS = 'git-hooks/hooks.sh';
var PRE_PUSH = '.git/hooks/pre-push';

function copy(src, dest, mode) {
    mode = mode || 0755;

    return fs.createReadStream(src)
        .pipe(fs.createWriteStream(dest, {
            mode: mode
        }));
}

gulp.task('hooks.update', function(cb) {
    fs.exists(PRE_PUSH, function(exists) {
        if (exists) {
            copy(HOOKS, PRE_PUSH)
                .on('finish', cb.bind(this, null));
        } else {
            cb();
        }
    });
});

function install(cb) {
    copy(HOOKS, PRE_PUSH)
        .on('finish', cb.bind(this, null));
}

gulp.task('hooks.install', install);
gulp.task('hooks', install); // alias

gulp.task('hooks.clear', function(cb) {
    rimraf(PRE_PUSH, cb);
});

// @TODO: refactor hooks - move verbosity logic to js land
gulp.task('hooks.run', function(cb) {
    var scripts = [
        'run-10-tests.sh'
    ];

    var tasks = scripts.map(function(script) {
        return function(cb) {
            var child = spawn('git-hooks/' + script, [], {
                stdio: 'inherit'
            });
            process.on('exit', function() {
                child.kill();
            });
            child.on('close', function(code) {
                if (code == 130) {
                    gulp.emit('exit', code);
                } else if (code != 0) {
                    gulp.emit('tl.fail', "Hooks failed");
                }
                cb();
            });
        };
    });

    async.series(tasks, cb);
});

gulp.task('t', ['hooks.run']); // dep. alias
