
var _ = require('lodash');
var gulpHandlebars = require('gulp-handlebars');
var handlebars = require('handlebars');
var hbarsMinify = require('../lib/hbarsMinify');

/**
 * Обычный плагин хандлебарс с пренастроенными опциями
 * @param opts
 * @returns {*}
 */
function handlebarsify(opts) {
    opts = _.defaults(opts || {}, {
        handlebars: handlebars,
        processAST: function(ast) {
            hbarsMinify.ast(ast);
        }
    });
    return gulpHandlebars(opts);
}

module.exports = handlebarsify;
