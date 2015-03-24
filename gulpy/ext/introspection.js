
var glob = require('glob').sync;
var env = require('slot/env');
var path = require('path');

/**
 * Возвращает пути компонентов слота для браузерифая
 * @param {string[]} [names] необходимые компоненты, если не заданы - вернет все
 */
exports.components = function(names) {
    var paths = glob('components/*', {
        cwd: env.slotPath
    });

    if (names) {
        paths = paths.filter(function(component) {
            var basename = path.basename(component, '.js');

            return names.indexOf(basename) != -1;
        });
    }

    return paths.map(function(component) {
        return 'slot/components/' + path.basename(component, '.js');
    });
};

/**
 * Возвращает пути плагинов слота для браузерифая
 * @param {string[]} [names] необходимые плагины, если не заданы - вернет все
 */
exports.plugins = function(names) {
    var plugins = glob('plugins/*.js', {
        cwd: env.slotPath
    }).map(function(pluginPath) {
        return path.basename(pluginPath, '.js');
    });

    if (names) {
        plugins = plugins.filter(function(plugin) {
            return names.indexOf(plugin) != -1;
        });
    }

    return plugins.map(function(pluginName) {
        return path.join('slot/plugins', pluginName);
    });
};
