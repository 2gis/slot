var gulp = require('gulp');
var mocha = require('gulp-mocha');
var verbose = require('./utils/verbose');
var runSequence = require('run-sequence').use(gulp);

verbose.setMessages('test', {
    start: 'Запускаю тесты, тыдыщ',
    error: 'Тесты провалены, иди фиксить!',
    success: 'С тестами всё ок, молодцом!'
});
gulp.task('test.run', function() {
    return gulp.src([
            'tests/unitTestConfig.js',
            '**/*.spec.js'
        ], {read: false})
        .pipe(mocha({
            globals: ['DEBUG']
        }));
});

gulp.task('test', function(cb) {
    if (process.env.TRAVIS) {
        runSequence(
            'cover.init',
            'test.run',
            'cover.report',
            'cover.send',
            cb
        );
    } else {
        runSequence('test.run', cb);
    }
});

gulp.task('default', ['test']);