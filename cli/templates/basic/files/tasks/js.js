var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var wrapper = require('gulp-wrapper');

var watchify = require('watchify');
var buffer = require('vinyl-buffer');
var glob = require('flat-glob').sync;
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var bundler = createBundler();

function createBundler() {
    var bundler = browserify({
        cache: {},
        packageCache: {},
        fullPaths: true,
        debug: !gulp.pot.release
    });

    if (!gulp.pot.release) {
        bundler = watchify(bundler);
    }

    glob([
        glob(['./modules/*/*.js']).filter(gulp.pot.isSameFolder),
        glob(['./components/*/*.js']).filter(gulp.pot.isSameFolder),
        glob(['./helpers/blocks/*/*.js']).filter(gulp.pot.isSameFolder)
    ]).forEach(function(entry) {
        bundler.require(entry);
    });

    gulp.pot.introspection.components().forEach(function(component) {
        bundler.require(component);
    });

    bundler.require('./client.js', {expose: 'app'});

    // Обеспечиваем работу инжектора в релизной сборке. Преобразование сделано
    // глобальным, так как в противном случае browserify последних версий обрабатывает
    // не все требуемые файлы.
    if (gulp.pot.release) {
        bundler.transform(gulp.pot.lib('injector').injectStream, {global: true});
    }

    return bundler;
}

function vendorStream() {
    return gulp.src('vendor/**/*.js')
        .pipe(concat('vendor.js'));
}

function configStream() {
    var paths = ['config/base.js'];

    if (gulp.pot.release) {
        paths.push('config/production.js');
    }

    var configWrap = {
        header: "(function(exports) {\n",
        footer: "\n})(typeof window == 'undefined' ? exports : window.config = {});"
    };

    return gulp.src(paths)
        .pipe(concat('config.js'))
        .pipe(wrapper(configWrap))
        .pipe(gulp.dest('build/private'));
}

function templateStream() {
    return gulp.pot.recipes.templates.compile()
        .pipe(concat('templates.js'));
}

function bundleStream() {
    return bundler.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer());
}

gulp.task('js.vendor', function() {
    return vendorStream()
        .pipe(gulp.dest('build/public/assets'));
});

gulp.task('js.config', function() {
    return configStream()
        .pipe(gulp.dest('build/public/assets'));
});

gulp.task('js.templates', function() {
    return templateStream()
        .pipe(gulp.dest('build/public/assets'));
});

gulp.task('js.bundle', function() {
    return bundleStream()
        .pipe(gulp.dest('build/public/assets'));
});

gulp.task('js.release', function() {
    var allJs = gulp.pot.esconcat(
        vendorStream(),
        configStream(),
        templateStream(),
        bundleStream()
    );

    return allJs
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('build/public/assets'));
});

var jsTasks = [];
if (!gulp.pot.release) {
    jsTasks = [
        'js.config',
        'js.vendor',
        'js.bundle',
        'js.templates'
    ];
} else {
    jsTasks = ['js.release'];
}
gulp.task('js', jsTasks);

exports.bundler = bundler;
