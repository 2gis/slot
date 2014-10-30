var fs = require('fs');
var gulp = require('gulp');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');

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

gulp.task('hooks', install);

gulp.task('hooks.clear', function(cb) {
    rimraf(PRE_PUSH, cb);
});

gulp.task('hooks.run', function(cb) {
    runSequence('test', 'lint', cb);
});
gulp.task('t', ['hooks.run']);
