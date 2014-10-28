var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

gulp.task('test', ['cover'], function() {
    return gulp.src([
        'tests/unitTestConfig.js',
        '**/*.spec.js'
    ], {read: false})
        .pipe(mocha({
            globals: ['DEBUG']
        }))
        .pipe(istanbul.writeReports({
            dir: './coverage',
            reporters: [ 'lcov', 'text']
        }));
});

gulp.task('cover', function(){
    return gulp.src([
        '*.js',
        'clientApp/*.js',
        '!clientApp/*.spec.js'
    ]).pipe(istanbul());
});

gulp.task('default', ['test']);
