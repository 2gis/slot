
var assert = require('assert'),
    path = require('path'),
    fs = require('fs');

var minify = require('../../gulpy/lib/hbarsMinify');

describe("Минификация шаблонов", function() {
    var specPath = path.join(__dirname, '/data');
    var files = fs.readdirSync(specPath);

    files.forEach(function(filename) {
        if (/(expect|skip)\.html/.test(filename)) return;

        var basename = filename.replace('.html', '');

        it(basename, function() {

            var template = fs.readFileSync(path.join(specPath, filename)).toString();
            var expected = fs.readFileSync(path.join(specPath, basename + '.expect.html')).toString();

            var minified = minify.template(template);

            assert.equal(minified, expected);
        });
    });
});