var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var verbose = require('./utils/verbose');

verbose.setMessages('test', {
    start: 'Запускаю тесты, тыдыщ',
    error: 'Тесты провалены, иди фиксить!',
    success: 'С тестами всё ок, молодцом!'
});
gulp.task('test', ['cover'], function() {
    return gulp.src([
            'tests/unitTestConfig.js',
            '**/*.spec.js'
        ], {read: false})
        .pipe(mocha({
            globals: ['DEBUG']
        }))
        .on('error', function() {
            gulp.emit('task_err', {task: 'test'});
        })
        .pipe(istanbul.writeReports({
            dir: './coverage',
            reporters: [ 'lcov', 'text']
        }));
});

gulp.task('cover', function() {
    return gulp.src([
        '*.js',
        'clientApp/*.js',
        '!clientApp/*.spec.js'
    ]).pipe(istanbul());
});

gulp.task('default', ['test']);