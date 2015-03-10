/**
 * @module SyncRegistry
 *
 * @description
 * Прокидывает на клиент необходимые данные: если записать сюда что-нибудь на сервере, потом можно прочитать это на клиенте
 * Логика сериализации и вставки данных в html пока реализуется в конечном приложении
 * ```js
 * var syncRegistry = slot.requireComponent('syncRegistry');
 * ```
 */
var env = require('../env');
var inherits = require('inherits');
var Registry = require('../lib/registry');

module.exports = SyncRegistry;
function SyncRegistry() {
    if (this instanceof SyncRegistry) {
        Registry.call(this);
    } else {
        return new SyncRegistry();
    }
}
inherits(SyncRegistry, Registry);

/**
 * На сервере работает как сеттер.
 * На клиенте как геттер: возвращает значение, выставленное на сервере.
 *
 * @param  {String} key ключ по которому синхронизируется значение
 * @param  {*} [value] значение, выставляемое на сервере, на клиенте возвращается если не было записано на сервере.
 * @return {*} Значение по ключу
 */
SyncRegistry.prototype.sync = function(key, value) {
    if (env.isServer) {
        return this.set(key, value).get(key);
    } else {
        return this.get(key, value);
    }
};
/**
 * Возвращает весь реестр, например на сервере для записи его в шаблон и передачи на клиент
 *
 * @return {Object} все данные реестра со всеми ключами и значениями
 */
SyncRegistry.prototype.read = function() {
    return this.data;
};
