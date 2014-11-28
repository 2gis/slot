// ----- файл отвечает за конечную генерации файлов для подключения к приложению  -----

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var pot = gulp['pot'];

var source = require('vinyl-source-stream');
var through = require('through2');
var l10nExtractor = require('./l10nExtractor');

var momentLangsPath = path.join(pot.projectPath, 'node_modules/moment/locale');

function loadMessages(lang, countryCode) {
    if (lang == 'ru') return null;

    var locale = lang + '_' + countryCode.toUpperCase();

    var lcpath = path.join('l10n', locale);
    if (!fs.existsSync(lcpath)) {
        lcpath = path.join('l10n', lang);
    }

    try {
        return req(path.join(lcpath, 'LC_MESSAGES/messages'));
    } catch (ex) {
        console.error("WARNING: Couldn't find messages for", lang, countryCode, "pair");
        return null;
    }
}

function getMomentLang(lang) {
    // для 'en' не подключаем язык отдельно, т.к. он по умолчанию в moment
    if (lang == 'en') return '';

    var text = '',
        pathLang = path.join(momentLangsPath, lang + '.js');
    if (fs.existsSync(pathLang)) {
        text = fs.readFileSync(pathLang, {encoding: 'utf8'});
    }
    if (text) {
        text = "if (typeof window != 'undefined') { window.moment = require('moment');\n" + text + "\n};";
    }

    return text;
}

function generateLocales(cb) {
    var config = pot.config;
    var locales = config['i18n.locales'];

    var streams = locales.map(function(locale) {
        var pair = locale.split('_');
        var lang = pair[0];
        var countryCode = pair[1];

        var formats = l10nExtractor.getFormats(lang, countryCode);
        var settings = l10nExtractor.getSettings(countryCode);
        var messages = loadMessages(lang, countryCode);

        var ns = "this['localeData'] = this['localeData'] || {};\n";

        var data = ns + "this['localeData']['" + locale + "'] = " + JSON.stringify([settings, formats, messages]) + ";\n";
        data += getMomentLang(lang);

        var stream = through();
        process.nextTick(function() {
            stream.write(data);
            stream.end();
        });

        return stream
            .pipe(source(locale + '.js'))
            .pipe(gulp.dest('build/public/assets/l10n'));
    });

    pot.eswait(streams, cb);
}

gulp.task('i18n.compile', ['i18n.po2json'], generateLocales);
