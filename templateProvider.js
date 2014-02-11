var env = require('./env');
var handlebars = require('handlebars');

// Возвращает объект, куда будем складывать шаблоны для неймспейса ns
function templates(ns) {
    ns = 'jst_' + ns;

    var templateConstructor = env.requirePrivate(ns);

    return templateConstructor(handlebars);
}

// ns - namespace
var tmpl = exports.tmpl = function(ns, template) {
    return templates(ns)[template];
};

var modulesCache = {};

exports.getTemplatesForModule = function(moduleName) {
    if (!(moduleName in modulesCache)) {
        var name,
            result = {},
            tmpls = templates('modules');

        for (name in tmpls) {
            var parts = name.split('/'),
                modName = parts[0],
                tmplName = parts[parts.length - 1]; // в случае modules/geoCard/templates/geoCard.html название шаблона geoCard

            if (modName == moduleName) {
                result[tmplName] = tmpls[name];
            }
        }
        modulesCache[moduleName] = result;
    }

    return modulesCache[moduleName];
};

// Возвращает шаблон, где moduleName - имя модуля, tmplName - имя шаблона
exports.moduleTmpl = function(moduleName, tmplName) {
    tmplName = tmplName || moduleName;

    return tmpl('modules', moduleName + '/' + tmplName);
};

exports.helperTmpl = function(blockName, tmplName) {
    tmplName = tmplName || blockName;

    return tmpl('helpers', blockName + '/' + tmplName);
};