
var _ = require('lodash'),
    namer = require('./lib/namer'),
    env = require('./env');

/**
 * Конструктор модулей. Создаёт инстанс модуля, обвешивая его конфиг всякими методами.
 *
 * @constructs slot.Module
 * @extends {slot.Slot}
 *
 * @param {slot.App} app - Инстанс приложения.
 * @param {Object} moduleConf - Конфиг модуля, тот самый js-объект из файла модуля.
 * @param {slot.Slot} slot - Инстанс слота для этого модуля.
 * @param {Object} cte - Кастомный шаблонизатор, по-умолчанию handlebars.
 */
module.exports = function(app, moduleConf, slot, cte) {
    // register default partials and helpers for current module

    var templates = slot.templates,
        templateEngine = cte || env.get('handlebars'),
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

            return new templateEngine.SafeString(tmpl(options.hash.context || this, getTmplOptions()));
        },

        /**
         * Подключение модуля. Модуль должен быть проинициализирован.
         *
         * Метод имеет два интерфейса
         * Односложный: {{module 'fromTo'}} - на вход подаётся имя модуля, или инстанс модуля, а в это место будет вставлен результат его рендеригна
         * Блоковый: {{#module 'fromTo'}} <div> {{{this}}} </div> {{/module}} - то же, но html модуля вставляется внутрь конструкции
         *
         * @param {string|Object} name - Имя существующего дочернего модуля, либо инстанс модуля.
         * @param {Object} options - Параметры хелпера. Считается, что если есть options.fn, то хелпер вызван в блоковом режиме.
         * @returns {string} Готовый html.
         */
        module: function(name, options) {
            var moduleInstance = _.isString(name) ? slot.modules[name] : name;

            if (_.isArray(moduleInstance)) throw new Error("Module helper: unable to render array of modules");
            if (!moduleInstance) return '';

            var html = new templateEngine.SafeString(moduleInstance.render());
            if (options && options.fn) { // Значит вызван как if с блоком {{{this}}} внутри
                html = options.fn(html);
            }

            return html;
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
                throw new TypeError(
                    'Unable to render first partial of this: ' +
                        _.toArray(arguments).slice(0, arguments.length - 1).join(', ')
                );
            }

            return templateHelpers.partial.call(this, tmpl, options);
        },

        /**
         * Модификаторы для элементов.
         *
         * На сервере проставляются через ```slot.element('name').mod({...})```.
         *
         * @example
         * <div class="dashboard__title {{mods 'elemBase elem'}}"></div>
         * // При этом модификаторы из последних элементов будут приоритетнее.
         *
         * @returns {string}
         */
        mods: function() {
            var mods = {};

            for (var i = 0, len = arguments.length; i < len - 1; i++) {
                if (slot.element(arguments[i])) {
                    mods = _.extend(mods, slot.element(arguments[i]).mod());
                }
            }

            return _.map(mods, function(value, name) {
                return namer.modificatorClass(name, value);
            }).join(' ');
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

        options.partials = _.defaults(partials, templatePartials, templateEngine.partials);
        options.helpers = _.defaults(helpers, templateHelpers, templateEngine.helpers);

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
        /**
         * Initializes the module with the given params. Invokes callback when init process is ready.
         */
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
         * @returns {string}
         */
        render: function(cvc) {
            var blockName = moduleConf.block || moduleConf.type;

            // Вызов метода viewContext должен быть всегда.
            var viewContext = moduleConf.viewContext ? moduleConf.viewContext(cvc) : slot.viewContext;
            viewContext = cvc || viewContext || {};

            if (!_.isObject(viewContext)) {
                throw new TypeError('viewContext must be an object, but а ' + viewContext);
            }

            var moduleId = this.id,
                moduleInstance = app.getModuleDescriptorById(moduleId),
                template = moduleConf.type || moduleConf.template,
                tag = moduleConf.tag || 'div',
                attrs = {};

            if (!moduleInstance) {
                throw new Error('Module with id ' + moduleId + ' not found');
            }

            if (moduleConf.viewAttrs) {
                attrs = _.isFunction(moduleConf.viewAttrs) ? moduleConf.viewAttrs() : moduleConf.viewAttrs;
            }

            var mods = moduleInstance.mods || {},
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
            classes = classes.concat(namer.stringifyMods(mods));

            attrs['class'] = _.uniq(_.compact(classes)).join(' ');

            return renderTag(tag, attrs, compiledTemplateHTML);
        },

        id: moduleConf.uniqueId,

        interface: moduleConf.interface,

        dispatcher: moduleConf.dispatcher,

        elements: moduleConf.elements,

        /**
         * @type {slot.Slot}
         */
        slot: slot,

        /**
         * @type {boolean}
         */
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
