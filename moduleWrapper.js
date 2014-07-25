var _ = require('lodash'),
    namer = require('./namer'),
    env = require('./env');

// Module wrapper expects a raw module objects as an argument for constructor.
module.exports = function(app, moduleConf, slot) {
    // register default partials and helpers for current module

    var templates = slot.templates,
        handlebars = env.get('handlebars'),
        templatePartials,
        templateHelpers,
        clientInitCalled = false,
        moduleWrapper;

    templatePartials = _.omit(templates, moduleConf.type);

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

            module = _.isString(module) ? slot.modules[module] : module;

            if (_.isArray(module)) throw new Error("Module helper: unable to render array of modules");

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

    slot.extendHelpers(templateHelpers); // для расширения в конечных приложениях
    slot.extendPartials(templatePartials); // для расширения в конечных приложениях

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

    slot.hasPartial = function(name) {
        return name in templatePartials;
    };

    function renderTag(tag, attrs, content) {
        // Собираем все HTML-аттрибуты в строку
        var attributesString = _.reduce(attrs, makeAttributes, '');

        function makeAttributes(memo, val, key) {
            return memo + ' ' + key + '="' + val + '"';
        }

        return '<' + tag + attributesString + '>' + content + '</' + tag + '>';
    }

    moduleWrapper = {

        // Initializes the module with the given params. Invokes callback when init process is ready
        init: function(state, callback) {
            slot.stage = 'initing';

            // moduleConf.init.length < 2 - показывает что moduleConf.init имеет менее 2х аргументов, то есть не имеет коллбэк
            var isInitSync = !moduleConf.init || moduleConf.init.length < 2;

            var done = function(err) {
                if (callback) callback(err);
                // При асинхронном ините модуля слот мог умереть раньше,
                // чем завершится инициализация, и не надо перезаписывать его стэйдж!
                if (!err && slot.stage == 'initing') {
                    slot.stage = 'inited';
                }
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

        /**
         * Вызывается каждый раз после рендера представления
         */
        bind: function() {
            if (moduleConf.bind) {
                moduleConf.bind();
            }
        },

        changeState: function() {
            if (moduleConf.changeState) {
                moduleConf.changeState.apply(moduleConf, arguments);
            }
        },

        /**
         * Renders the module and wraps it in a div with special metadata to identify this module in DOM.
         * @param {object} [customViewContext] - объект, который пошлется в шаблон вместо viewContext модуля
         *
         * @returns {String} rendered HTML
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
                blockName = moduleConf.block || moduleConf.type;

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
            moduleClass = namer.moduleClass(blockName);
            classString = attrs['class'] || '';
            classes = classString.split(/\s+/);

            classes.push(moduleClass);

            _.each(mods, function(val, key) {
                var modClass = namer.modificatorClass(key, val);

                classes.push(modClass);
            });

            attrs['class'] = _.uniq(classes).join(' ');

            return renderTag(tag, attrs, compiledTemplateHTML);
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

        isEventsBound: false,

        type: moduleConf.type
    };

    return moduleWrapper;
};