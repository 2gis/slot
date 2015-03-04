
var del = require('del');

var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc');
var docsFiles = [
    'config.js',
    'env.js',
    'slot/index.js',
    'moduleConstructor.js',
    'app.js',
    'serverApp.js',
    'clientApp/index.js',

    'lib/*.js',

    'README.md'
];

gulp.task('docs', ['docs.build', 'docs.watch']);

gulp.task('docs.build', function() {
    del.sync('docs/api');

    return gulp.src(docsFiles)
        .pipe(jsdoc.parser({
            plugins: ['plugins/markdown']
        }))
        .pipe(jsdoc.generator('./docs/api', {
            path: 'ink-docstrap',
            theme: 'spacelab'
        }, {
            applicationName: 'slot'
        }));
});

gulp.task('docs.watch', function() {
    gulp.watch(docsFiles, ['docs.build']);
});