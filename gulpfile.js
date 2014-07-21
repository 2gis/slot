
var gulp = require('gulp');
var mocha = require('gulp-mocha');

var exitCode = 0;

function errHandler() {
    exitCode = 1;
    process.stdout.write('\u0007'); // beep sound if possible
}

gulp.on('err', function(e) {
    errHandler();
    console.error(e.err.stack);
});

gulp.task('test', function() {
    return gulp.src([
        'tests/unitTestConfig.js',
        '**/*.spec.js'
    ], {read: false})
        .pipe(mocha({
            globals: ['DEBUG']
        }));
});

gulp.task('default', ['test']);


// last exit handler in gulpfile
process.on('exit', function() {
    if (exitCode) {
        process.exit(exitCode);
    }
});
