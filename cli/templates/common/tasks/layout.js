var gulp = require('gulp');
var template = require('gulp-template');

gulp.task('layout', function() {
    var layoutStream = gulp.src('layout/layout.html')
        .pipe(template({release: pot.release}));

    var templatify = pot.snippet('templatify');

    return templatify(layoutStream, {
        namespace: 'this'
    }, 'jst_layouts');
});
