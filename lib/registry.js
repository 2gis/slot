/**
 * @module Registry
 * @type {Registry}
 * @description
 *
 */
module.exports = Registry;
function Registry() {
    this.data = {};
}

/**
 * @param {string} name
 * @returns {boolean}
 */
Registry.prototype.has = function(name) {
    return this.data.hasOwnProperty(name);
};

/**
 * @param {string} name
 * @param {*} [def]
 * @returns {*}
 */
Registry.prototype.get = function(name, def) {
    return this.has(name) ? this.data[name] : def;
};

/**
 * @param {string} name
 * @param {*} value
 * @returns {Registry} Инстанс регистра для чейнинга
 */
Registry.prototype.set = function(name, value) {
    this.data[name] = value;
    return this;
};

/**
 * @param {string} name
 */
Registry.prototype.remove = function(name) {
    delete this.data[name];
};

/**
 * Наполняет реестр данными из переданного объекта
 *
 * @param {Object} data
 * @returns {Registry} Инстанс регистра для чейнинга
 */
Registry.prototype.setup = function(data) {
    for (var name in data) {
        if (data.hasOwnProperty(name)) {
            this.data[name] = data[name];
        }
    }
    return this;
};
