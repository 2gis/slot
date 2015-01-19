
function Registry() {
    this.data = {};
}

/**
 * Устанавливает значение по умолчанию для заданного ключа.
 *
 * Возвращает значение по ключу если оно есть, если нет,
 * записывает переданное значение и возвращает его.
 *
 * @param {string} name
 * @param {*} [def={}]
 * @returns {*}
 */
Registry.prototype.setDefault = function(name, def) {
    if (def === void 0) def = {};

    return this.has(name) ? this.data[name] : (this.data[name] = def);
};

/**
 * @param {string} name
 * @returns {boolean}
 */
Registry.prototype.has = function(name) {
    return this.data.hasOwnProperty(name);
};

/**
 * @param {string} name
 * @returns {*}
 */
Registry.prototype.get = function(name) {
    return this.data[name];
};

Registry.prototype.set = function(name, value) {
    this.data[name] = value;
};

/**
 * @param {string} name
 */
Registry.prototype.remove = function(name) {
    delete this.data[name];
};

/**
 * @param {Object} data
 */
Registry.prototype.setup = function(data) {
    for (var name in data) {
        if (data.hasOwnProperty(name)) {
            this.data[name] = data[name];
        }
    }
};

module.exports = Registry;
