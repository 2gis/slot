
var _ = require('lodash');
var gulp = require('gulp');
var through = require('through2');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

gulp.task('manifest', function(done) {
    var manifest = {
        blocks: [],
        modules: [],
        helpers: []
    };

    var blocksStream = gulp.src('blocks/*')
        .pipe(through.obj(function(file, enc, cb) {
            if (file.isDirectory()) {
                manifest.blocks.push(path.basename(file.path));
            }
            cb();
        }));

    var modulesStream = gulp.src('modules/*')
        .pipe(through.obj(function(file, enc, cb) {
            if (file.isDirectory()) {
                manifest.modules.push(path.basename(file.path));
            }
            cb();
        }));

    var helpersStream = gulp.src('helpers/blocks/*')
        .pipe(through.obj(function(file, enc, cb) {
            if (file.isDirectory()) {
                manifest.helpers.push(path.basename(file.path));
            }
            cb();
        }));

    pot.eswait(blocksStream, modulesStream, function() {
        var text = 'module.exports = ' + JSON.stringify(manifest);

        mkdirp('build/private', function(err) {
            if (err) return done(err);

            fs.writeFile('build/private/manifest.js', text, done);
        });
    });
});
