var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var through = require('through2'); // 0.6.3
var _ = require('lodash');

var errors = {};
/**
 * Проверяет не произошла ли ошибка при проверка файла
 * Если найдена ошибка, то бросается событие 'tl.fail'
 *
 * @param type
 * @returns {*}
 */
function check(type) {
    return through.obj(function(file, enc, cb) {
        if(!file[type].success) {
            errors[type] = true;
            gulp.emit('tl.fail', type + ' failed');
        }
        cb(null, file);
    });
}

/**
 * Завершает проверку, если ошибок не обнаружено, то выводит сообщение об этом
 *
 * @param type
 * @returns {Function}
 */
function end(type) {
    return function() {
        if (!errors[type]) {
            console.log(type + ' passed'.green);
        }
    }
}

gulp.task('lint.jscs', function() {
    var result = gulp.src([
        '*.js'
    ])
    .pipe(jscs())
    .pipe(jscs.reporter('console'))
    .pipe(check('jscs'))
    .on('end', end('jscs'));

    return result;
});

gulp.task('lint.jshint', function() {
    var result = gulp.src([
            '*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(check('jshint'))
        .on('end', end('jshint'));

    return result;
});

gulp.task('lint', ['lint.jscs', 'lint.jshint']);