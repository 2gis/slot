var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var through = require('through2');
var verbose = require('./utils/verbose');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;

/**
 * Проверяет не произошла ли ошибка при проверке файла
 * Если найдена ошибка, то бросается событие 'tl.fail'
 *
 * @param {string} type
 * @returns {*}
 */
function check(type) {
    return through.obj(function(file, enc, cb) {
        if (!file[type].success) {
            gulp.emit('task_err', {task: 'lint.' + type});
        }
        cb(null, file);
    });
}

var files = [
    '**/*.js',
    '!docs/**/*.js',
    '!smokesignals/index.js',
    '!**/node_modules/**/*',
    '!coverage/**/*.js',
    '!cli/templates/**/*.js'
];

verbose.setMessages('lint.jscs', {
    error: 'jscs failed',
    success: 'jscs passed'
});
gulp.task('lint.jscs', function() {
    return gulp.src(files)
        .pipe(jscs())
        .pipe(jscs.reporter('console'))
        .pipe(check('jscs'));
});

verbose.setMessages('lint.jshint', {
    error: 'jshint failed',
    success: 'jshint passed'
});
gulp.task('lint.jshint', function() {
    return gulp.src(files)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(check('jshint'));
});

gulp.task('lint', function(cb) {
    runSequence('lint.jscs', 'lint.jshint', cb);
});

gulp.task('eslint', function(cb) {
    exec('npm run -s lint:hook', function(err, stdout) {
        if (err) {
            console.log(stdout);
            gulp.emit('tl.fail', 'ESlint failed');
        }

        cb();
    });
});
