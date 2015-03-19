var gulp = require('gulp');
var runSequence = require('run-sequence');
var bundler = require('./js').bundler;

gulp.task('watch', function() {
    gulp.watch('vendor/**/*.js', ['js.vendor']);

    gulp.watch('config/**/*.js', function() {
        runSequence('js.config', 'server');
    });

    gulp.watch(gulp.pot.recipes.templates.globs(), function() {
        runSequence('js.templates', 'server');
    });

    gulp.watch('layout/layout.html', function() {
        runSequence('layout', 'server');
    });

    gulp.watch([
        'layout/layout.less',
        'modules/**/*.less',
        'helpers/blocks/**/*.less'
    ], ['css']);

    gulp.watch('public/**/*', ['assets']);

    gulp.watch('server.js', ['server']);

    bundler.on('update', function() {
        runSequence('js.bundle', 'server');
    });
});
