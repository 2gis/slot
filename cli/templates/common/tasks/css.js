var gulp = require('gulp');
var less = require('gulp-less');
var csso = require('gulp-csso');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var concat = require('gulp-concat');

var glob = require('flat-glob').sync;

gulp.task('css', function() {
    var files = glob([
        'layout/layout.less',
        glob(['helpers/blocks/**/*.less']).filter(pot.isSameFolder),
        glob(['modules/**/*.less']).filter(pot.isSameFolder)
    ]);

    return gulp.src(files)
        .pipe(concat('app.css'))
        .pipe(less())
        .on('error', function(err) {
            gutil.log(err.toString());
            gutil.beep();
            this.emit('end');
        })
        .pipe(gulpif(pot.release, csso()))
        .pipe(gulp.dest('build/public/assets'));
});

gulp.task('css.watch', function() {
    gulp.watch([
        'layout/layout.less',
        'modules/**/*.less',
        'helpers/blocks/**/*.less'
    ], ['css']);
});
