var gulp = require('gulp');
var requireDir = require('require-dir');
var colors = require('colors/safe');

requireDir('./tasks');

var exitCode = 0;

function errHandler(msg) {
    exitCode = 1;
    if (msg) {
        console.log(colors.bgRed(msg));
    }
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
