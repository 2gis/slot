var path = require('path');
var fs = require('fs');

var gulp = require('gulp');

gulp.on('err', function(e) {
    console.error(e.err.stack);
});

//require('./tasks/hooks');
//require('./tasks/tests');

var tasksDirPath = path.join(__dirname, './tasks');

fs.readdirSync(tasksDirPath).forEach(function(name) {
    if (path.extname(name) === '.js') {
        var filePath = path.join(tasksDirPath, name);

        if (fs.lstatSync(filePath).isFile()) {
            require(filePath);
        }
    }
});

// last exit handler in gulpfile
process.on('exit', function() {
    if (gulp.exitCode) {
        process.exit(gulp.exitCode);
    }
});
