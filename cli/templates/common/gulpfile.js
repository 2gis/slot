var del = require('del');
var gulp = require('gulp');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');

// Инициализируем pot и записываем его в глобальную область
var args = require('yargs').argv;
global.pot = require('slot/gulpy/pot')(args);
pot.projectPath = __dirname;

// Загружаем все таски
requireDir('./tasks');

gulp.task('clean', function(cb) {
    del('build', cb);
});

gulp.task('build', [
    'js',
    'css',
    'layout',
    'assets'
]);

gulp.task('dev', function(cb) {
    runSequence('build', 'server', 'watch', cb);
});

gulp.task('default', ['build']);
