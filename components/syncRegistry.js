/**
 * @module syncRegistry
 *
 * @description
 * Прокидывает на клиент чё-нибудь: если записать сюда что-нибудь на сервере, потом можно прочитать это на клиенте
 * Логика сериализации и вставки данных в html пока реализуется в конечном приложении
 * ```js
 * var syncRegistry = slot.requireComponent('syncRegistry');
 * ```
 */
var env = require('../env');

module.exports = function(app) {
    var registry = {};

    /**
     * Возвращает значение. Если значение не было задано, возвращает пустой объект
     * @param  {String} key   ключ по которому будет возвращено значение
     * @param  {*}      def   дефолтное значение, которое будет возвращено, если по ключу ничего нет. @TODO выяснить, действительно ли он нужен
     * @return {*}            значение, сохранённое по этому ключу, либо undefined
     */
    function get(key, def) {
        def = def === undefined ? {} : def;

        return key in registry ? registry[key] : def;
    }

    /**
     * Сохраняет значение в реестр
     * @param  {String} key   ключ, по которому будет сохранено значение
     * @param  {*}      value сохраняемое значение
     * @return {*}            сохранённое значение
     */
    function save(key, value) {
        return registry[key] = value;
    }

    var syncRegistry = {
        get: get,
        save: save,

        /**
         * Загружает реестр, например, переданный с сервера на клиент
         * @param  {Object} reg объект реестра со всеми ключами и значениями
         */
        load: function(reg) {
            registry = reg;
        },

        /**
         * На сервере работает как сеттер, на клиенте как геттер
         * @type {[type]}
         */
        sync: env.isServer ? save : get
    };

    return syncRegistry;
};
