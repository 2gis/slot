var assert = require('assert');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

describe('Тест экстрактора handlebars для Babel', function() {

    var specPath = path.join(__dirname, 'fixtures');
    var files = fs.readdirSync(specPath);

    files.forEach(function(filename) {
        if (/expected\.js/.test(filename)) return;

        var basename = filename.replace('.html', '');

        var execOpts = {
            cwd: __dirname
        };

        it('файл ' + basename, function(done) {
            if (basename.indexOf('.skip') == -1) {

                var keywords = ([ '_t', '_nt:1,3', '_pt:1c,2', '_npt:1c,2,4', '_ht', '_hnt:1,3']).map(function(k) {
                    return '-k ' + k;
                }).join(' ');

                var comments = (['";"']).map(function(c) {
                    return '-c ' + c;
                }).join(' ');

                var cmd = '../run_hb.py ' + keywords + ' ' + comments + ' ' + 'fixtures/' + filename;

                exec(cmd, execOpts, function(err, stdout, stderr) {
                    if (err || stderr) {
                        assert(err || stderr);
                        return done();
                    }
                    var result;

                    try {
                        result = JSON.parse(stdout);
                    } catch (ex) {
                        assert(false, "Cannot parse '" + stdout + "'. No Babel installed ?");
                        return done();
                    }
                    result = result[Object.keys(result)[0]];

                    var expected = require('./fixtures/' + basename + '.expected');

                    assert.equal(JSON.stringify(result), JSON.stringify(expected)); // deepEqual не красиво дифф выводит

                    done();
                });
            }
        });
    });
});
