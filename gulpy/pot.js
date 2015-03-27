/*
 * Хранилище методов-удобняшек для тасок
 * (ну то есть аналог slot'а в слоте)
 */

var _ = require('lodash');
var args = require('yargs').argv;
var path = require('path');
var requireDir = require('./lib/requireDir');
var es = require('event-stream');
var fs = require('fs');

module.exports = function(gulp) {
    var pot;

    /**
     * Возвращает dirname - название каталога в котором лежит данный файл, basename - название самого файла без расширения
     * @param {string} filepath
     * @returns {{dirname: String, basename: String}}
     */
    function getPathBases(filepath) {
        var dirname = path.dirname(filepath).split('/');
        dirname = dirname[dirname.length - 1];
        var basename = path.basename(filepath, path.extname(filepath));

        return {
            dirname: dirname,
            basename: basename
        };
    }

    /**
     * true только если filepath будет типа modules/firmCard/firmCard.js
     * Т.е. когда имя файла совпадает с именем его родительской папки
     * @param {String} filepath
     * @returns {boolean}
     */
    function isSameFolder(filepath) {
        var bases = getPathBases(filepath);
        return bases.dirname == bases.basename;
    }

    /**
     * Фильтр для сборки модулей. Чёрный список имеет приоритет: если модуль есть и там и там, он не попадёт в сборку. + идёт фильтрация по isSameFolder
     * @param {string} filepath - путь до файла
     * @returns {boolean}
     */
    function modulesFilter(filepath) {
        if (!pot.flags) throw new Error("You must define flags to run modulesFilter");
        var bases = getPathBases(filepath);

        if (_.contains(pot.config.blackListModules, bases.basename)) {
            return false;
        }

        if (pot.config.whiteListModules && pot.config.whiteListModules.length && !_.contains(pot.config.whiteListModules, bases.basename)) {
            return false;
        }

        return bases.dirname == bases.basename;
    }

    function lib(name) {
        return require('./lib/' + name);
    }

    function plugin(name) {
        return require('./plugins/' + name);
    }

    function snippet(name) {
        return require('./snippets/' + name);
    }

    function watchTasks(tasks) {
        var watch = [];
        for (var name in tasks) {
            if (!tasks.hasOwnProperty(name)) continue;

            if (name.indexOf('watch') != -1) {
                watch.push(name);
            }
        }
        return watch;
    }

    /**
     * Подключает папку с модулями которые требуют pot
     * @param {string} path cwd'based path
     * @param {object} [opts] options
     * @param {function} [opts.filter] filter(filepath) фильтр для поключаемых модулей
     * @returns {object}
     */
    function loadDir(path, opts) {
        var tasks = requireDir(path, opts);
        _.each(tasks, function(task, name) {
            if (typeof task == 'function') {
                tasks[name] = task(pot);
            }
        });
        return tasks;
    }

    function projectRequire(relPath) {
        if (!pot.projectPath) throw new Error("You must define pot.projectPath in your gulpfile!");
        return require(path.join(pot.projectPath, relPath));
    }

    function normalizeStreams(arr) {
        return _.compact(_.flatten(arr, true));
    }

    function esmerge() {
        var streams = normalizeStreams([].slice.call(arguments));
        if (streams.length == 0) {
            return streams[0];
        }
        return es.merge.apply(es, streams);
    }

    var waitStreams = require('./lib/eswait');

    function eswait() {
        var streams = [].slice.call(arguments);
        var cb = streams.pop();
        return waitStreams(normalizeStreams(streams), cb);
    }


    var concatStreams = require('./lib/esconcat');

    function esconcat() {
        var streams = [].slice.call(arguments);
        return concatStreams(normalizeStreams(streams));
    }

    var recipes;

    pot = {
        esmerge: esmerge,
        eswait: eswait,
        esconcat: esconcat,
        verbose: function() {
            if (pot.args.verbose) {
                console.log.apply(console, arguments);
            }
        },
        watchTasks: watchTasks,
        get recipes() {
            if (!recipes) {
                recipes = loadDir(path.join(__dirname, 'recipes'));
            }
            return recipes;
        },
        initEnvGlobals: function(rootPath) {
            try {
                var env = require('../env');
                env.setRootPath(rootPath);
            } catch (ex) {
                console.warn("Could'nt init slot/env", ex);
            }
        },
        args: args,
        gulp: gulp,
        release: !!args.release, // shortcut for some args
        projectRequire: projectRequire,
        isSameFolder: isSameFolder,
        modulesFilter: modulesFilter,
        lib: lib,
        plugin: plugin,
        snippet: snippet,
        loadDir: loadDir,
        loadTasks: loadDir, // alias
        t: _.template,

        // @TODO: будем ли менять место положение конфигов для сборки в приложении?
        get config() {
            var baseCfg = pot.projectRequire('config/build');
            var glob = require('flat-glob').sync;

            var extPattern = path.join(pot.projectPath, './config/build/*.js');
            var localsPattern = path.join(pot.projectPath, './config/build/*.local.js');

            function extendByPattern(pattern) {
                glob([pattern]).forEach(function(filepath) {
                    var basename = path.basename(filepath, path.extname(filepath));
                    if (basename == 'index') return;
                    if (basename.indexOf('local') == basename.length - 'local'.length) {
                        basename = path.basename(basename, '.local');
                    }

                    var cfg = require(filepath);

                    _.each(cfg, function(value, key) {
                        baseCfg[basename + '.' + key] = value;
                    });
                });
            }

            extendByPattern(extPattern);
            extendByPattern(localsPattern);

            var localCfgPath = path.join(pot.projectPath, './config/build/local.js');
            if (fs.existsSync(localCfgPath)) {
                _.extend(baseCfg, require(localCfgPath));
            }

            return baseCfg;
        },
        app: {} // namespace для конечного продукта
    };
    var extList = ['platform', 'ulimit', 'watch', 'introspection']; // loadDir не используем для ленивости! ленивость для скорости!
    // идея в чем - если мы перестаем использовать тот или иной модуль он автоматически перестает загружаться
    // экономя время и память
    var extensions = {};

    extList.forEach(function(name) {
        Object.defineProperty(pot, name, {
            enumerable: true,
            get: function() {
                if (!(name in extensions)) {
                    var ext = require('./ext/' + name);
                    if (typeof ext == 'function' && ext.length == 1) {
                        ext = ext(pot);
                    }
                    extensions[name] = ext;
                }
                return extensions[name];
            }
        });
    });

    return pot;
};
