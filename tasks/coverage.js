var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');

var coverable = [
    '*.js',
    'lib/*.js',
    'plugins/*.js',
    'components/*.js',
    'clientApp/*.js'
];

gulp.task('cover.init', function() {
    return gulp.src(coverable)
        .pipe(istanbul());
});
gulp.task('cover.report', function() {
    return gulp.src(coverable)
        .pipe(istanbul.writeReports({
            dir: './coverage',
            reporters: [ 'lcov', 'text']
        }));
});

gulp.task('cover.send', function() {
    return gulp.src('./coverage/lcov.info')
        .pipe(coveralls());
});