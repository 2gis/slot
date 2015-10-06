var _ = require('lodash');
var namer = require('./lib/namer');

/**
 * Конструктор модулей. Создаёт инстанс модуля, обвешивая его конфиг всякими методами.
 *
 * @constructs slot.Module
 * @extends {slot.Slot}
 *
 * @param {slot.App} app - Инстанс приложения.
 * @param {Object} moduleConf - Конфиг модуля, тот самый js-объект из файла модуля.
 * @param {slot.Slot} slot - Инстанс слота для этого модуля.
 */
module.exports = function(app, moduleConf, slot) {
    var clientInited = false;


    /**
     * Генерирует HTML для заданного тега
     *
     * @param {string} tag Название тега
     * @param  {Object} attrs Атрибуты тега
     * @param {string} content Содержимое
     * @returns {string} Строка с HTML заданного тега
     */
    function renderTag(tag, attrs, content) {
        function makeAttributes(memo, val, key) {
            return memo + ' ' + key + '="' + val + '"';
        }

        // Собираем все HTML-аттрибуты в строку
        var attributesString = _.reduce(attrs, makeAttributes, '');

        return '<' + tag + attributesString + '>' + content + '</' + tag + '>';
    }

    var moduleWrapper = {
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
                moduleDescriptor = app.getModuleDescriptorById(moduleId),
                template = moduleConf.type || moduleConf.template,
                tag = moduleConf.tag || 'div',
                attrs = {};

            if (!moduleDescriptor) {
                throw new Error('Module with id ' + moduleId + ' not found');
            }

            if (moduleConf.viewAttrs) {
                attrs = _.isFunction(moduleConf.viewAttrs) ? moduleConf.viewAttrs() : moduleConf.viewAttrs;
            }

            var mods = moduleDescriptor.mods || {},
                compiledTemplate = slot.templates[template],
                compiledTemplateHTML = typeof compiledTemplate == 'function' ?
                    compiledTemplate(viewContext, slot.templateOptions()) :
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

        viewContext: moduleConf.viewContext,

        kill: _.bind(slot.kill, slot),
        remove: _.bind(slot.remove, slot),
        dispose: _.bind(slot.dispose, slot),

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
        moduleWrapper.block = _.bind(app.block, app, moduleConf.uniqueId);
        moduleWrapper.bindEvents = _.bind(app.bindEvents, app, moduleConf.uniqueId);
        moduleWrapper.unbindEvents = _.bind(app.unbindEvents, app, moduleConf.uniqueId);
    }

    return moduleWrapper;
};
