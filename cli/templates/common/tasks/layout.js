var gulp = require('gulp');
var template = require('gulp-template');
var runSequence = require('run-sequence').use(gulp);

gulp.task('layout', function() {
    var layoutStream = gulp.src('layout/layout.html')
        .pipe(template({release: pot.release}));

    var templatify = pot.snippet('templatify');

    return templatify(layoutStream, {
        namespace: 'this'
    }, 'jst_layouts');
});

gulp.task('layout.watch', function() {
    gulp.watch('layout/layout.html', function() {
        runSequence('layout', 'server');
    });
});
