/**
 * Модуль добавляет кастомные handlebars хелперы
 * @module slot/templateHelpers
 */

var _ = require('lodash');
var namer = require('../lib/namer');

module.exports = function(slot, templateEngine) {
    return {
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

        /** Подключение первого имеющегося (из списка) партиала */
        p: function() {
            var tmpl = null,
                options = arguments[arguments.length - 1],
                partial;

            for (var i = 0, len = arguments.length; i < len - 1; i++) {
                partial = arguments[i];
                tmpl = typeof partial == 'function' ? partial : slot.templates[partial];
                if (tmpl) break;
            }

            if (!tmpl) {
                throw new TypeError(
                    'Unable to render first partial of this: ' +
                    _.toArray(arguments).slice(0, arguments.length - 1).join(', ')
                );
            }

            return new templateEngine.SafeString(tmpl(options.hash.context || this, slot.templateOptions()));
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
};
