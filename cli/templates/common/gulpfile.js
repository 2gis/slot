var del = require('del');
var gulp = require('gulp');
var requireDir = require('require-dir');
var runSequence = require('run-sequence').use(gulp);

// Инициализируем pot и записываем его в глобальную область
global.pot = require('slot/gulpy/pot')(gulp);
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

// Объединяем все watch-таски в одну
gulp.task('watch', pot.watchTasks(gulp.tasks));

gulp.task('dev', function(cb) {
    runSequence('build', 'server', 'watch', cb);
});

gulp.task('default', ['build']);
