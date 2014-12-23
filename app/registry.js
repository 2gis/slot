
function Registry() {
    this.data = {};
}

/**
 * Возвращает значение или пустой объект по заданному ключу
 * @param {string} name
 * @returns {*}
 */
Registry.prototype.hash = function(name) {
    return this.data[name] || (this.data[name] = {});
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
