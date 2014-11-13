
var del = require('del');

var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc');

gulp.task('docs', function() {
    del.sync('docs/api');

    return gulp.src(['*.js', '!gulpfile.js', 'clientApp/index.js', 'clientApp/transitions.js'])
        .pipe(jsdoc.parser({
            plugins: ['plugins/markdown']
        }))
        .pipe(jsdoc.generator('./docs/api', {
            applicationName: 'slot'
        }));
});
