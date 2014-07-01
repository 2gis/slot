var _ = require('underscore'),
    baseAppConstructor = require('./app'),
    namer = require('./namer'),
    defer = require('./defer');

/**
 * В каком приоритете исполняем транзишены
 *
 * Чем выше, тем приоритетней
 * @type {Array}
 */
var transitionsPriority = [
    'map',
    'callout'
];

module.exports = function() {
    var baseApp = baseAppConstructor(),
        app = baseApp.instance,
        internals = baseApp.internals;

    if (typeof $ != 'undefined') {
        /**
         * jQuery плагин, который:
         * - выставляет модификатор элементу
         * - запрашивает модификаторы элемента
         *
         * Особенности:
         * НЕ дергает modHandlers
         * НЕ работает на сервере, соответственно не пытаемся собирать эти модификаторы на клиенте
         * Частично повторяет логику app.mod
         * При попытке получить или установить/запросить модификатор на несуществующий элемент, получаем undefined
         *
         * @param {object|undefined} modificators
         *     Если объект, то устанавливает переданные модификаторы и возвращает все модификаторы
         *     Если undefined, просто возвращает объект-модификаторы
         *
         * @returns {object} модификаторы первого элемента. Если нужна другая логика - сообщите по адресу: г. Новосибирск, площадь Маркса 7.
         */
        $.fn.mod = function(modificators) {
            var firstMod;

            modificators = modificators || {};

            this.each(function(i, element) {
                var oldMods = element.mods || {};

                _.each(modificators, function(val, key) {
                    var oldModVal = oldMods[key];

                    if (oldModVal === val) return;

                    if (oldModVal == undefined && (val === false || val === null)) { // Кейс когда html прилетел с сервера
                        oldModVal = true;
                    }

                    $(element)
                        .removeClass(namer.modificatorClass(key, oldModVal))
                        .addClass(namer.modificatorClass(key, val));
                });

                element.mods = _.extend(element.mods || {}, modificators);
                firstMod = firstMod || element.mods;
            });

            return firstMod;
        };

        /**
         * jQuery плагин, который ставит или убирает модификатор элементу или элементам
         * @param {string} modificator
         * возвращает JQuery-коллекцию
         */
        $.fn.toggleMod = function(modificator) {
            if (modificator) {
                var mod = namer.modificatorClass(modificator, true);

                this.toggleClass(mod);
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

            if (DEBUG) require('./debugInfo').init();
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

            transitions.sort(function(a, b) {
                a = a.purpose;
                b = b.purpose;

                if (!a || !b) return 0;

                a = _(transitionsPriority).indexOf(a);
                b = _(transitionsPriority).indexOf(b);

                if (a == -1 || b == -1) return 0;

                return a - b;
            });

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
