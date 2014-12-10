/**
 * @module syncRegistry
 * @TODO: надо будет полностью его переделать на использование класса app/registry
 *
 * @description
 * Прокидывает на клиент чё-нибудь: если записать сюда что-нибудь на сервере, потом можно прочитать это на клиенте
 * Логика сериализации и вставки данных в html пока реализуется в конечном приложении
 * ```js
 * var syncRegistry = slot.requireComponent('syncRegistry');
 * ```
 */
var env = require('../env');

module.exports = function() {
    var registry = {};

    /**
     * Возвращает значение. Если значение не было задано, возвращает undefined
     *
     * @param  {String} key         ключ по которому будет возвращено значение
     * @param  {*}      def   дефолтное значение, которое будет возвращено, если по ключу ничего нет
     * @return {*}                  значение, сохранённое по этому ключу, либо undefined
     */
    function get(key, def) {
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
         * Возвращает весь реестр, например на сервере для записи его в шаблон и передачи на клиент
         * @return {Object} registry объект реестра со всеми ключами и значениями
         */
        read: function() {
            return registry;
        },

        /**
         * Загружает реестр, например, переданный с сервера на клиент
         * @param  {Object} reg объект реестра со всеми ключами и значениями
         */
        load: function(reg) {
            registry = reg;
        },

        /**
         * На сервере работает как сеттер, на клиенте как геттер. На клиенте возвращает значение, выставленное на сервере.
         * @param  {String} key             ключ по которому синхронизируется значение
         * @param  {*} [value={}] значение, выставляемое на сервере, на клиенте возвращается если не было записано на сервере.
         * @return {*}                      значение по ключу
         */
        sync: function(key, value) {
            value = value === undefined ? {} : value;
            if (env.isServer) {
                return save(key, value);
            } else {
                return get(key, value);
            }
        }
    };

    return syncRegistry;
};
