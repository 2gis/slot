/**
 * Структура SlugEntry которая описывает распарсенный кусок урла - слаг с параметрами
 * @TODO: при переходе на тайпскрипт заменить этот класс обычным типом
 * @type {Function}
 */
function SlugEntry(slug, params) {
    this.slug = slug;
    this.params = params;
}

SlugEntry.prototype.matchedFrom = function(string, index) {
    this.string = string;
    this.index = index;

    return this;
};

module.exports = SlugEntry;
