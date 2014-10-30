
var gulp = require('gulp');
var colors = require('colors/safe');
var requireDir = require('require-dir');
requireDir('./tasks');

var exitCode = 0;

function errHandler() {
    exitCode = 1;
    process.stdout.write('\u0007'); // beep sound if possible
}

gulp.on('err', function(e) {
    errHandler();
    console.error(e.err.stack);
});
gulp.on('tl.fail', errHandler);

var verbose = require('./tasks/utils/verbose');
verbose.enable();

// last exit handler in gulpfile
process.on('exit', function() {
    if (exitCode) {
        process.exit(exitCode);
    }
});
