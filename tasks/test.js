var gulp = require('gulp');
var mocha = require('gulp-mocha');

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