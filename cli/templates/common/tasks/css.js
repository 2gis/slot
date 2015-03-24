var gulp = require('gulp');
var less = require('gulp-less');
var csso = require('gulp-csso');
var gulpif = require('gulp-if');
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
        .pipe(gulpif(pot.release, csso()))
        .pipe(gulp.dest('build/public/assets'));
});
