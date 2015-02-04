
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
