
var del = require('del');

var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc');

gulp.task('docs', function() {
    del.sync('docs/api');

    return gulp.src([
        'config.js',
        'env.js',
        'slot.js',
        'moduleConstructor.js',
        'app.js',
        'serverApp.js',
        'clientApp/index.js',
        'clientApp/transitions.js',

        'lib/*.js',

        'README.md'
    ])
        .pipe(jsdoc.parser({
            plugins: ['plugins/markdown']
        }))
        .pipe(jsdoc.generator('./docs/api', {
            applicationName: 'slot'
        }));
});
