var gulp = require('gulp');

gulp.task('assets', function() {
    return gulp.src('public/**/*')
        .pipe(gulp.dest('build/public'));
});

gulp.task('assets.watch', function() {
    gulp.watch('public/**/*', ['assets']);
});
