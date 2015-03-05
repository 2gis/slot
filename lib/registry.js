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
    return this.data[name] || def;
};

/**
 * @param {string} name
 * @param {*} value
 */
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
 * Наполняет реестр данными из переданного объекта
 *
 * @param {Object} data
 */
Registry.prototype.setup = function(data) {
    for (var name in data) {
        if (data.hasOwnProperty(name)) {
            this.data[name] = data[name];
        }
    }
};
