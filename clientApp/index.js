var _ = require('lodash');
var baseAppConstructor = require('../app');
var namer = require('../namer');
var defer = require('../defer');
var transitionsHelper = require('./transitions');


module.exports = function() {
    var baseApp = baseAppConstructor();
    var app = baseApp.instance;
    var internals = baseApp.internals;
    var appBinded = false; // Флаг указывает, биндились ли события глобально после инициализации приложения, или еще нет

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
         * @param {Object} [modificators]
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
                    firstEl.mods = namer.getModificatorsFromClassName(firstEl.className)
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
         * jQuery плагин, который ставит или убирает модификатор элементу или элементам
         * @param {string} modificator
         * возвращает JQuery-коллекцию
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
        return '#module-' + moduleId;
    }

    function bind(selector, elementName, container, eventName, handler, on) {
        var exceptions = ['scroll', 'block', 'error'],
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

    _.extend(app, {
        server: false,

        bind: function(params) {
            app._stage = 'bind';

            var rootId = app.mainModule.id();

            var stateTracker = app.requireComponent('stateTracker');
            var appState = app.requireComponent('appState');

            appState.on('statechange', function(diff) {
                app.processModules(rootId, '*', function(instance) {
                    if (instance.changeState) {
                        instance.changeState.call(instance, diff, appState);
                    }
                }, true);

                app.runTransitions(function() {
                    transitionsEnded.resolve();
                    transitionsEnded = defer();
                });
            });

            stateTracker.bind();

            // Навешиваем события на все модули
            app.bindEvents(rootId);

            if (DEBUG) require('./../debugInfo').init();
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
         * @param {function} handler
         * @param {string} purpose к какому модулю/сущности относится транзишен
         */
        addTransition: function(handler, purpose) {
            handler.purpose = purpose;
            transitions.push(handler);
        },

        runTransitions: function(callback) {
            if (transitionsAreRunning) return;
            transitionsAreRunning = true;

            transitionsHelper.sort(transitions);
            transitionStep();

            function transitionStep() {
                var transition = transitions.shift();
                if (transition !== undefined) {
                    transition(transitionStep);
                } else {
                    transitionsAreRunning = false;
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
         * @param {object} options
         *        {boolean} options.dontBindEvents не навешивать обработчики событий
         *                  (может пригодиться, если вызвать rerender в init модуля)
         */
        rerender: function(moduleId, options) {
            var activeModule = app.getModuleById(moduleId),
                html = activeModule.wrapper.render();

            options = options || {};

            $(moduleBlockId(moduleId)).replaceWith(html);
            activeModule.wrapper.isEventsBound = false;

            if (!options.dontBindEvents) {
                app.bindEvents(moduleId);
            }
        },

        /**
         * Возвращает jQuery-объект по заданному элементу для текущего модуля
         *
         * @param {string} moduleId
         * @param {string} elementName
         */
        element: function(moduleId, elementName) {
            var module = app.getModuleById(moduleId),
                moduleElements = module.instance.elements,
                blockName = module.instance.block || module.type;

            if (moduleElements && moduleElements[elementName]) {
                var selector = moduleElements[elementName].selector || '.' + namer.elementClass(blockName, elementName),
                    elements = $(selector, moduleBlockId(moduleId)); // Возвращаемые элементы (jQuery объект)

                // Фолбек на dashed-case на переходной период
                if (!elements.length) {
                    selector = '.' + namer.elementClass(blockName, elementName, true);
                    elements = $(selector, moduleBlockId(moduleId));
                }

                return elements;
            }
        },

        /**
         * Навешивает события на элементы модуля (или на один элемент, если передан elementName) и все дочерние модули.
         *
         * @param {string} moduleId
         * @param {string} elementName
         * @param {boolean} on
         */
        processEvents: function(moduleId, elementName, on) {
            var module = app.getModuleById(moduleId),
                elements = module.instance.elements;

            // Если у модуля уже навешены события, не навешиваем их еще раз
            // Проверяем на SKIP_APP_RUN для того, чтобы работали dom-тесты. Вообще, надо выкосить такие dom-тесты
            if (on && module.wrapper.isEventsBound === true && module.slot.stateRendered() && !(typeof SKIP_APP_RUN != 'undefined' && SKIP_APP_RUN)) {
                return;
            }
            module.wrapper.isEventsBound = on;

            if (elementName) {
                elements = _.pick(module.instance.elements, elementName);
            }

            // Пробегаемся по ассоциативному массиву элементов, заданном в модуле
            _.each(elements, function(eventsConfig, elementName) {
                var selector = eventsConfig.selector || '.' + namer.elementClass(module.instance.block || module.type, elementName),
                    containerId = moduleBlockId(moduleId);

                // Выбираем все значения из объекта, за исключением селектора
                var handlers  = _.omit(eventsConfig, 'selector');

                _.each(handlers, function(handler, eventName) {
                    var container = $(containerId);

                    bind(selector, elementName, container, eventName, handler, on);
                });
            });

            if (on) {
                module.wrapper.clientInit();
                module.wrapper.bind();
            }

            // Рекурсивно вызываем функцию для всех дочерних элементов
            _.each(module.children, function(childModuleId) {
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
