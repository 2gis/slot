var gulp = require('gulp');
var mocha = require('gulp-mocha');
var verbose = require('./utils/verbose');

verbose.setMessages('test', {
    start: 'Запускаю тесты, тыдыщ',
    error: 'Тесты провалены, иди фиксить!',
    success: 'С тестами всё ок, молодцом!'
});
gulp.task('test', function() {
    return gulp.src([
            'tests/unitTestConfig.js',
            '**/*.spec.js'
        ], {read: false})
        .pipe(mocha({
            globals: ['DEBUG']
        }));
});

gulp.task('default', ['test']);