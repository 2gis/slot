var gulp = require('gulp');
var template = require('gulp-template');

gulp.task('layout', function() {
    var layoutStream = gulp.src('layout/layout.html')
        .pipe(template({release: gulp.pot.release}));

    var templatify = gulp.pot.snippet('templatify');

    return templatify(layoutStream, {
        namespace: 'this'
    }, 'jst_layouts');
});
