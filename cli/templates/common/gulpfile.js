var gulp = require('gulp');

var del = require('del');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');

var args = require('yargs').argv;
gulp.pot = require('slot/gulpy/pot')(args);

requireDir('./tasks');

gulp.task('clean', function(cb) {
    del('build', cb);
});

gulp.task('build', [
    'js',
    'css',
    'layout',
    'assets'
]);

gulp.task('dev', function(cb) {
    runSequence('build', 'server', 'watch', cb);
});

gulp.task('default', ['build']);
