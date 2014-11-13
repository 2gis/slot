
var _ = require('lodash');
var gutil = require('gulp-util');
var through = require('through2');
var po2json = require('po2json');

const PLUGIN_NAME = 'po2json';

function optimizePo(data) {
    _.each(data, function(value, key) {
        if (value.length == 2 && value[0] == null && value[1] == '') {
            delete data[key];
        }
    });
    data[''] = _.pick(data[''], 'plural-forms');
    return data;
}

function debugFill(data) {
    _.forOwn(data, function(message, msgid) {
        if (_.isArray(message)) {
            _.each(message, function(messageItem, index) {
                if (messageItem) {
                    if (index<2) {
                        // Форма единственного числа
                        message[index] = '_' + msgid.substr(msgid.indexOf('\u0004') + 1) + '_';
                    } else {
                        // Форма множественного числа
                        message[index] = '_' + message[0] + '_';
                    }
                }
            });
            data[msgid] = message;
        }
    });
    return data;
}

module.exports = function(options) {
    options = _.defaults(options || {}, {
        pretty: false,
        fuzzy: false,
        stringify: false,
        commonJs: true,
        format: 'raw',
        ext: '.js',
        debug: false
    });
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) return cb(null, file);
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        if (file.isBuffer()) {
            var data = po2json.parse(file.contents.toString(), options);

            if (options.debug) {
                data = debugFill(data);
            }

            data = JSON.stringify(optimizePo(data));
            if (options.commonJs) {
                data = 'module.exports = ' + data;
            }
            if (options.header) {
                data = options.header + data;
            }
            file.contents = new Buffer(data);
            file.path = gutil.replaceExtension(file.path, options.ext);
            return cb(null, file);
        }
    });
};