
var gulp = require('gulp');
var requireDir = require('require-dir');
requireDir('./tasks');

var requireDir = require('require-dir');
var dir = requireDir('./tasks');

var exitCode = 0;

function errHandler(message) {
    if (message) {
        console.log(message.red);
    }
    exitCode = 1;
    process.stdout.write('\u0007'); // beep sound if possible
}

gulp.on('err', function(e) {
    errHandler();
    console.error(e.err.stack);
});
gulp.on('tl.fail', errHandler);

// last exit handler in gulpfile
process.on('exit', function() {
    if (exitCode) {
        process.exit(exitCode);
    }
});
