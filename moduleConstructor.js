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
        clientInited = false,
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
        },

        /**
         * Модификаторы для элементов
         *
         * Пример использования:
         * <div class="dashboard__title {{mods 'elemBase elem'}}"></div>
         * При этом модификаторы из последних элементов будут приоритетнее.
         *
         * На сервере проставляются через slot.element('name').mod({...})
         *
         * @returns {string}
         */
        mods: function() {
            var mods = {};

            for (var i = 0, len = arguments.length; i < len - 1; i++) {
                mods = _.extend(mods, slot.element(arguments[i]).mod());
            }

            return _.map(mods, function(value, name) {
                return namer.modificatorClass(name, value);
            }).join(' ');
        },

        /**
         * Хелпер для проверки наличия заиниченного модуля
         *
         * {{#ifmodule 'searchBar'}}
         *    {{module 'searchBar'}}
         * {{/ifmodule}}
         *
         * @param {String} name имя модуля
         * @param {Object} options
         * @returns {String}
         */
        ifmodule: function(name, options) {
            if (slot.modules[name]) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        }
    };

    slot.templateHelpers = templateHelpers;

    slot.extendTmplHelpers = function(helpersToAdd) {
        _.extend(templateHelpers, helpersToAdd);
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
        // Initializes the module with the given params. Invokes callback when init process is ready.
        init: function(state, callback) {
            slot.stage = slot.STAGE_INITING;

            function done(err) {
                // При асинхронном ините модуля слот мог умереть раньше,
                // чем завершится инициализация, и не надо менять его стэйдж!
                if (!err && slot.stage == slot.STAGE_INITING) {
                    slot.stage = slot.STAGE_INITED;
                }

                if (callback) {
                    callback(err);
                }
            }

            if (moduleConf.init) {
                // Eсть второй аргумент (callback).
                if (moduleConf.init.length >= 2) {
                    moduleConf.init(state, done);
                } else {
                    moduleConf.init(state);
                    done();
                }
            } else {
                done();
            }
        },

        clientInit: function() {
            if (!clientInited) {
                if (moduleConf.clientInit) {
                    moduleConf.clientInit.apply(moduleConf, arguments);
                }

                clientInited = true;
            }
        },

        /**
         * Вызывается каждый раз после рендера представления.
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
         *
         * @param {Object} [customViewContext] Объект, который пошлется в шаблон вместо viewContext модуля.
         * @returns {string}
         */
        render: function(customViewContext) {
            var blockName = moduleConf.block || moduleConf.type;

            // Вызов метода viewContext должен быть всегда.
            var originalViewContext = moduleConf.viewContext ? moduleConf.viewContext(customViewContext) : slot.viewContext,
                viewContext = customViewContext || originalViewContext || {};

            if (!_.isObject(viewContext)) {
                throw new TypeError('viewContext must be an object, but а ' + viewContext);
            }

            var moduleId = moduleConf.uniqueId,
                moduleInstance = app.getModuleDescriptorById(moduleId),
                template = moduleConf.type || moduleConf.template,
                tag = moduleConf.tag || 'div',
                attrs = {};

            if (moduleConf.viewAttrs) {
                attrs = _.isFunction(moduleConf.viewAttrs) ? moduleConf.viewAttrs() : moduleConf.viewAttrs;
            }

            var mods = moduleInstance.mods,
                compiledTemplate = slot.templates[template],
                compiledTemplateHTML = typeof compiledTemplate == 'function' ?
                    compiledTemplate(viewContext, getTmplOptions()) :
                    '';

            attrs.id = 'module-' + moduleId;
            attrs['data-module'] = moduleConf.type;

            // Генерируем CSS класс модуля
            var moduleClass = namer.moduleClass(blockName),
                classString = attrs['class'] || '',
                classes = classString.split(/\s+/);

            classes.push(moduleClass);

            _.each(mods, function(val, key) {
                var modClass = namer.modificatorClass(key, val);
                classes.push(modClass);
            });

            attrs['class'] = _.uniq(classes).join(' ');

            return renderTag(tag, attrs, compiledTemplateHTML);
        },

        id: function() {
            return moduleConf.uniqueId;
        },

        interface: moduleConf.interface,

        dispatcher: moduleConf.dispatcher,

        elements: moduleConf.elements,

        slot: slot,

        isEventsBound: false,

        type: moduleConf.type
    };

    if (app.isClient) {
        moduleWrapper.block = _.partial(app.block, moduleConf.uniqueId);
        moduleWrapper.bindEvents = _.partial(app.bindEvents, moduleConf.uniqueId);
        moduleWrapper.unbindEvents = _.partial(app.unbindEvents, moduleConf.uniqueId);
    }

    return moduleWrapper;
};
