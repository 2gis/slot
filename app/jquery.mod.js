
var namer = require('../lib/namer'),
    _ = require('lodash');

if (typeof $ != 'undefined') {
    /**
     * jQuery плагин, который:
     * - выставляет модификаторы элементу;
     * - запрашивает модификаторы элемента.
     *
     * Особенности:
     * - НЕ дергает modHandlers;
     * - НЕ работает на сервере, соответственно не пытаемся собирать эти модификаторы на клиенте;
     * - частично повторяет логику app.mod;
     * - при отсутствии элементов, получаем undefined.
     *
     * @param {Object} [mods]
     *     Если указан, то устанавливает переданные модификаторы и возвращает все модификаторы.
     *     Если не указан, просто возвращает модификаторы.
     *
     * @returns {Object} Модификаторы первого элемента.
     */
    $.fn.mod = function(mods) {
        var firstEl = this[0];

        if (firstEl === undefined) {
            return firstEl;
        }

        // нет модификаторов для установки -> просто возращаем mods первого элемента
        if (!mods) {
            // если mods не установлен, парсим и устанавливаем его из className
            return firstEl.mods || (
                    firstEl.mods = namer.parseMods(firstEl.className)
                );
        }

        this.each(function(index, el) {
            // оптимизация: $.removeClass и $.addClass парсят регулярками при каждом применении,
            // а так как применений может быть много, лучше распарсить один раз и работать уже с массивом.
            var classNames = el.className.match(/\S+/g) || [];
            // читаем через $.mod() , чтобы распарсился из className, если еще не успел.
            var elMods = $(el).mod();

            _.each(mods, function(newValue, name) {
                var currentValue = elMods[name];

                if (newValue == currentValue) {
                    return;
                }

                // есть что-то для удаления
                if (
                    currentValue != null &&
                    currentValue != false &&
                    (typeof currentValue != 'number' || !isNaN(currentValue))
                ) {
                    classNames.splice(
                        classNames.indexOf(namer.modificatorClass(name, currentValue)),
                        1
                    );
                }

                // есть что-то для добавления
                if (
                    newValue != null &&
                    newValue != false &&
                    (typeof newValue != 'number' || !isNaN(newValue))
                ) {
                    classNames.push(namer.modificatorClass(name, newValue));
                }

                elMods[name] = newValue;
            });

            el.className = classNames.join(' ');
        });

        return firstEl.mods;
    };

    /**
     * jQuery плагин, который ставит или убирает модификатор элементу или элементам.
     *
     * @param {string} modificator
     * @returns {Array} JQuery-коллекция.
     */
    $.fn.toggleMod = function(modificator) {
        if (modificator) {
            this.each(function(i, element) {
                var el = $(element),
                    mod = namer.modificatorClass(modificator, true);
                el.toggleClass(mod);
            });
        }

        return this;
    };
}