
var _ = require('lodash');
var gulp = require('gulp');
var rename = require('gulp-rename');
var babel = require('./babel');
var pot = gulp.pot;
var config = pot.config;

require('./locales');

gulp.task('i18n.mode', function() {
    var src = !pot.args['i18n-debug'] ? 'private/js/i18n_release.js' : 'private/js/i18n_debug.js';
    gulp.src(src)
        .pipe(rename('i18n_mode.js'))
        .pipe(gulp.dest('build/private'));
});

function opts(o) {
    return _.defaults(o, {
        executable: 'python ./bin/i18n/run_babel.py',
        locale: pot.args.locale,
        verbose: pot.args.verbose
    });
}

function extract(cb) {
    babel(opts({
        src: [
            'blocks/',
            'components/',
            'helpers/',
            'modules/'
        ],
        dest: 'l10n/messages.pot',
        command: 'extract',
        mapping: './bin/i18n/babel.cfg',
        // В этом конфиге настраиваются экстракторы и исключения
        keyword: config.i18n.keywords,
        'add-comments': config.i18n.comments,
        'sort-output': true,
        'width': config.i18n.width,
        'no-default-keywords': true,
        'strip-comment-tags': true,
        'no-location': true,
        'msgid-bugs-address': 'online4@2gis.ru',
        'copyright-holder': 'Online4 2gis team'
    }), cb);
}
gulp.task('i18n.extract', extract);

function init(cb) {
    babel(opts({
        command: 'init',
        src: 'l10n/messages.pot',
        dest: 'l10n'
    }), cb);
}
gulp.task('i18n.init', init);

function update(cb) {
    babel(opts({
        command: 'update',
        'width': config.i18n.width,
        'no-fuzzy-matching': true,
        'ignore-obsolete': false, // возможно надо будет выставить в true
        src:'l10n/messages.pot',
        dest: 'l10n'
    }), cb);
}
gulp.task('i18n.update', update);

function po2json() {
    return pot.recipes.po2json.compile({
        debug: pot.args['i18n-debug']
    });
}
gulp.task('i18n.po2json', po2json);

gulp.task('i18n', ['i18n.mode', 'i18n.compile']);
