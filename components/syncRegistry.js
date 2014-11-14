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
     * @param  {String} key         ключ по которому будет возвращено значение
     * @param  {*}      syncValue   дефолтное значение, которое будет возвращено, если по ключу ничего нет. @TODO выяснить, действительно ли он нужен
     * @return {*}                  значение, сохранённое по этому ключу, либо undefined
     */
    function get(key, syncValue) {
        return registry[key];
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
         * @param  {*} [serverSideValue={}] значение, выставляемое на сервере, на клиенте оно игнорируется
         * @return {*}                      значение по ключу
         */
        sync: function(key, serverSideValue) {
            if (env.isServer) {
                serverSideValue = serverSideValue === undefined ? {} : serverSideValue;

                return syncRegistry.save(key, serverSideValue);
            } else {
                var value = syncRegistry.get(key);

                if (value === undefined && serverSideValue !== undefined) { // Ситуация, когда sync дёргается на клиенте, но не был дёрнут на сервере
                    throw new Error('[slot syncRegistry.sync] you are trying to get the value of registry[' + key +
                        '] on the client via sync(), but that value wasnt setted on the server!');
                }

                return value;
            }
        }
    };

    return syncRegistry;
};
