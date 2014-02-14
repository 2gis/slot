var utils = require('./utils'),
    _ = require('underscore'),
    namer = require('./namer'),
    templateProvider = require('./templateProvider'),
    handlebars = require('handlebars');

// Module wrapper expects a raw module objects as an argument for constructor.
module.exports = function(app, moduleConf, slot) {

    // register default partials and helpers for current module

    var templates = templateProvider.getTemplatesForModule(moduleConf.type),
        templatePartials,
        templateHelpers,
        clientInitCalled = false,
        moduleWrapper;

    templatePartials = (function() {
        var partials = {};

        _.each(templates, function(template, name) {
            if (name == moduleConf.type) return;
            partials[name] = template;
        });

        return partials;
    })();

    // Кастомные хелперы
    templateHelpers = {
        // Подключение не основного файла шаблона через инструкцию {{partial "file" context=variable}}
        partial: function(partial, options) {
            var tmpl = (typeof partial == 'function') ? partial : templates[partial];

            if (!tmpl) throw new Error("Unable to render partial " + partial);

            return new handlebars.SafeString(tmpl(options.hash.context || this, getTmplOptions()));
        },

        // Подключение модуля. Модуль должен быть проинициализирован.
        module: function(module) {
            var moduleName = module;

            module = _.isString(module) ? slot.modules[module] : module; // Это неочевидно, копий шаблонов может быть много

            // Из какого-то шаблона подключается несуществующий модуль
            if (!module) throw new Error("Module helper: unable to render module " + moduleName);

            return new handlebars.SafeString(module.render());
        },

        // Подключение первого имеющегося (из списка) партиала
        p: function() {
            var tmpl = null,
                options = arguments[arguments.length - 1],
                partial;

            for (var i = 0, len = arguments.length; i < len - 1; i++) {
                partial = arguments[i];
                tmpl = typeof partial == 'function' ? partial : templates[partial];
                if (tmpl) break;
            }

            if (!tmpl) {
                throw new Error(
                    "Unable to render first partial of this: " + _.toArray(arguments).slice(0, arguments.length - 1).join(', ')
                );
            }

            return templateHelpers.partial.call(this, tmpl, options);
        }
    };

    function getTmplOptions() {
        var options = {},
            partials = moduleConf.getPartials ? moduleConf.getPartials() : {},
            helpers = moduleConf.getHelpers ? moduleConf.getHelpers() : {};

        options.partials = _.defaults(partials, templatePartials, handlebars.partials);
        options.helpers = _.defaults(helpers, templateHelpers, handlebars.helpers);

        return options;
    }

    slot.renderPartial = function(template, ctx) {
        var tmpl = slot.templates[template];

        if (!tmpl) {
            throw new Error('slot.renderPartial: partial "' + template + '" not found');
        }

        return tmpl(ctx, getTmplOptions());
    };

    moduleWrapper = {

        // Initializes the module with the given params. Invokes callback when init process is ready
        init: function(state, callback) {
            // moduleConf.init.length < 2 - показывает что moduleConf.init имеет менее 2х аргументов, то есть не имеет коллбэк
            var isInitSync = !moduleConf.init || moduleConf.init.length < 2;

            var done = function(err) {
                if (callback) callback(err);
                slot.isInited = !err;
            };

            if (moduleConf.init) {
                moduleConf.init(state, done);
            }

            // если нет инита или он есть, но не ждет коллбэков
            if (!moduleConf.init || isInitSync) {
                done();
            }
        },

        clientInit: function() {
            if (clientInitCalled) return;

            if (moduleConf.clientInit) {
                moduleConf.clientInit.apply(moduleConf, arguments);
                clientInitCalled = true;
            }
        },

        changeState: function() {
            if (moduleConf.changeState) {
                moduleConf.changeState.apply(moduleConf, arguments);
            }
        },

        // Renders the module and wraps it in a div with special metadata to identify this module in DOM.
        // Returns rendered HTML.
        /**
         * @param {object} customViewContext - объект, который пошлется в шаблон вместо viewContext модуля
         */
        render: function(customViewContext) {
            var realvc,
                viewContext,
                moduleId,
                moduleInstance,
                template,
                tag,
                attrs,
                mods,
                compiledTemplate,
                compiledTemplateHTML,
                moduleClass,
                classString,
                classes,
                attributesString,
                html;

            realvc = (moduleConf.viewContext) ? moduleConf.viewContext(customViewContext) : ""; // Вызов метода viewContext должен быть всегда
            viewContext = customViewContext || realvc || {};

            if (!_.isObject(viewContext)) {
                throw new Error("viewContext must return object, but was returned " + viewContext);
            }

            moduleId = moduleConf.uniqueId;
            moduleInstance = app.getModuleById(moduleId);
            template = moduleConf.type || moduleConf.template;
            tag = moduleConf.tag || 'div';
            attrs = {};
            if (moduleConf.viewAttrs) {
                attrs = _.isFunction(moduleConf.viewAttrs) ? moduleConf.viewAttrs() : moduleConf.viewAttrs;
            }
            mods = moduleInstance.mods;
            compiledTemplate = slot.templates[template];
            compiledTemplateHTML = typeof compiledTemplate == 'function' ?
                compiledTemplate(viewContext, getTmplOptions()) :
                '';

            attrs.id = 'module-' + moduleId;
            attrs['data-module'] = moduleConf.type;

            // Генерируем CSS класс модуля
            moduleClass = namer.moduleClass(moduleConf.type);
            classString = attrs['class'] || '';
            classes = classString.split(/\s+/);

            classes.push(moduleClass);

            _.each(mods, function(val, key) {
                var modClass;

                // @TODO удалить
                modClass = namer.moduleModificatorClassTemp(moduleConf.type, key, val);
                classes.push(modClass);

                modClass = namer.moduleModificatorClass(key, val);

                classes.push(modClass);
            });

            classes = _.uniq(classes);

            attrs['class'] = classes.join(' ');

            // Собираем все HTML-аттрибуты в строку
            attributesString = _.reduce(attrs, makeAttributes, '');

            function makeAttributes(memo, val, key) {
                return memo + ' ' + key + '="' + val + '"';
            }

            html = '<' + tag + attributesString + '>' + compiledTemplateHTML + '</' + tag + '>';

            return html;
        },

        bindEvents: function(elementName) {
            var moduleId = moduleConf.uniqueId;

            app.bindEvents(moduleId, elementName);
        },

        block: function() {
            var moduleId = moduleConf.uniqueId;

            return app.block(moduleId);
        },

        id: function() {
            var moduleId = moduleConf.uniqueId;

            return moduleId;
        },

        interface: moduleConf.interface,

        dispatcher: moduleConf.dispatcher,

        elements: moduleConf.elements,

        slot: slot,

        type: moduleConf.type
    };

    return moduleWrapper;
};