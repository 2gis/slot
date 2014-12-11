
var _ = require('lodash');
var baseAppConstructor = require('../app');
var namer = require('../lib/namer');
var defer = require('../lib/defer');

module.exports = function() {
    var baseApp = baseAppConstructor();
    var app = baseApp.instance;
    var internals = baseApp.internals;

    var moduleBlockIdPrefix = 'module-';

    /**
     * Возвращает internal id модуля по элементу, если элемент является блоком модуля
     * @param  {DOMElement} element
     * @return {String|Undefined}
     */
    function getModuleId(element) {
        var ids = element.id.split(' ');
        for (var i = 0, l = ids.length; i < l; i++) {
            if (ids[i].startsWith(moduleBlockIdPrefix)) {
                return ids[i].replace(moduleBlockIdPrefix, '');
            }
        }
    }

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

            // если элемент — блок какого-то модуля, то применим модификаторы через app.mod
            var moduleId = getModuleId(firstEl);
            if (moduleId) {
                return app.mod(moduleId, mods);
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

    function moduleBlockId(moduleId) {
        return ['#', moduleBlockIdPrefix, moduleId].join('');
    }

    function bind(selector, elementName, container, eventName, handler, on) {
        var exceptions = ['scroll', 'block', 'error'], // Эти события нельзя подписывать как live, потому что они не всплывают
            method = on ? 'on' : 'off',
            selectorParam = elementName == 'block' ? null : selector;

        if (_.contains(exceptions, eventName)) {
            $(selector, container)[method](eventName, handler);
        } else {
            container[method](eventName, selectorParam, handler);
        }
    }

    // Делаем "ручку" для автотестов
    window.TestHandles = window.TestHandles || {};
    window.TestHandles.app = app;
    window.TestHandles.internals = internals;

    var transitions = [],
        transitionsEnded = defer(),
        transitionsAreRunning = false;

    var queue = [],
        queueAreRunning = false;

    /**
     * @class slot.ClientApp
     * @extends {slot.App}
     */
    /**
     * @lends slot.ClientApp
     */
    _.extend(app, {
        /**
         * @type {boolean}
         */
        server: false,

        bind: function() {
            app._stage = 'bind';

            app.emit('bind');

            // Навешиваем события на все модули
            app.bindEvents(app.mainModule.id);
        },

        runInQueue: function(handler) {
            queue.push(handler);
            if (queueAreRunning) return;
            queueStep();

            function queueStep() {
                var transition = queue.shift();
                if (transition !== undefined) {
                    transition(queueStep);
                } else {
                    queueAreRunning = false;
                }
            }
        },

        /**
         * Если транзишены не запущены, то при добавлении нового запускаем. Если запущены, просто добавляем в очередь.
         *
         * @param {Function} handler
         * @param {string} purpose - К какому модулю/сущности относится транзишен.
         */
        addTransition: function(handler, purpose) {
            handler.purpose = purpose;
            transitions.push(handler);
        },

        runTransitions: function(callback) {
            if (transitionsAreRunning) return;
            transitionsAreRunning = true;

            app.transitionSort(transitions);
            transitionStep();

            function transitionStep() {
                var transition = transitions.shift();
                if (transition !== undefined) {
                    transition(transitionStep);
                } else {
                    transitionsAreRunning = false;
                    transitionsEnded.resolve();
                    transitionsEnded = defer();
                    if (callback) callback();
                }

            }
        },

        /**
         * Когда стейт изменился - вызвалось поведение (transition), в конце которого вызывается наша функция.
         *
         * @param {Function} listener
         */
        onTransitionEnd: function(listener) {
            transitionsEnded.then(listener);
        },

        block: function(moduleId) {
            var containerId = moduleBlockId(moduleId);

            return $(containerId);
        },

        /**
         * Перерисовать модуль.
         *
         * @param {string} moduleId
         */
        rerender: function(moduleId) {
            var descriptor = app.getModuleDescriptorById(moduleId),
                html = descriptor.instance.render();

            app.unbindEvents(moduleId);

            $(moduleBlockId(moduleId)).replaceWith(html);

            app.bindEvents(moduleId);
        },

        /**
         * Возвращает jQuery-объект по заданному элементу для текущего модуля.
         * Ищет либо по БЭМ, либо по полю selector, но всегда внутри модуля
         *
         * @param {string} moduleId - id текущего модуля, внутри которого будет искаться элемент
         * @param {string} elementName - имя искомого элемента
         */
        element: function(moduleId, elementName) {
            var descriptor = app.getModuleDescriptorById(moduleId),
                elementDeclaration = descriptor.moduleConf.elements && descriptor.moduleConf.elements[elementName],
                blockName = descriptor.moduleConf.block || descriptor.type;

            // Кастомный селектор для элемента, относительно корневого элемента модуля
            var selector = elementDeclaration && elementDeclaration.selector || '.' + namer.elementClass(blockName, elementName);

            return $(selector, moduleBlockId(moduleId)); // Возвращаемые элементы (jQuery объект)
        },

        /**
         * Навешивает события на элементы модуля (или на один элемент, если передан elementName) и все дочерние модули.
         *
         * @param {string} moduleId
         * @param {string} elementName
         * @param {boolean} on
         */
        processEvents: function(moduleId, elementName, on) {
            // во время инициализации события не навешиваем и не отвешиваем вообще, в принципе.
            if (app._stage == 'init') return;

            var descriptor = app.getModuleDescriptorById(moduleId),
                elements = descriptor.moduleConf.elements;

            // Если у модуля уже навешены события, не навешиваем их еще раз
            if (on && descriptor.instance.isEventsBound) {
                return;
            }
            descriptor.instance.isEventsBound = on;

            if (elementName) {
                elements = _.pick(descriptor.moduleConf.elements, elementName);
            }

            // Пробегаемся по ассоциативному массиву элементов, заданном в модуле
            _.each(elements, function(eventsConfig, elementName) {
                var selector = eventsConfig.selector || '.' + namer.elementClass(descriptor.moduleConf.block || descriptor.type, elementName),
                    containerId = moduleBlockId(moduleId);

                // Выбираем все значения из объекта, за исключением селектора
                var handlers = _.omit(eventsConfig, 'selector');

                _.each(handlers, function(handler, eventName) {
                    bind(selector, elementName, $(containerId), eventName, handler, on);
                });
            });

            if (on) {
                descriptor.instance.clientInit();
                descriptor.instance.bind();
            }

            // Рекурсивно вызываем функцию для всех дочерних элементов
            _.each(descriptor.children, function(childModuleId) {
                app.processEvents(childModuleId, null, on);
            });
        },

        bindEvents: function(moduleId, elementName) {
            app.processEvents(moduleId, elementName, true);
        },

        unbindEvents: function(moduleId, elementName) {
            app.processEvents(moduleId, elementName, false);
        }
    });

    return app;
};
