
var async = require('async'),
    _ = require('lodash');

module.exports = function(app, params) {
    var moduleId = params.moduleId,
        timeouts = [], // Массив всех таймаутов для текущей копии модуля
        requests = [], // Массив запросов к апи
        intervals = []; // Массив всех интервалов для текущей копии модуля

    function loadModule(conf) {
        // новый объект необязательно создавать
        // сейчас нет и скорее всего не будет ситуации когда один и тот же конфиг передается на инициализацию разным
        // слотам даже в этом случае использование parentId далее происходит через копирование и опасности никакой нет
        conf.parentId = moduleId;
        return app.loadModule(conf);
    }

    function ensureFunction(f) {
        return _.isFunction(f) ? f : _.noop;
    }

    /**
     * @class slot.Slot
     */
    /**
     * @lends slot.Slot#
     */
    var slot = {
        STAGE_INITING: 1,
        STAGE_INITED: 2,
        STAGE_KILLED: 4,
        STAGE_DISPOSED: 8,
        STAGE_ALIVE: 3, // = STAGE_INITING | STAGE_INITED
        STAGE_NOT_ALIVE: 12, // = STAGE_DISPOSED | STAGE_KILLED

        /**
         * @type {int}
         */
        stage: 1,

        templates: params.templates,
        modules: {},
        config: app.config,

        addTransition: app.addTransition,
        runInQueue: app.runInQueue,
        invoke: app.invoke,

        /**
         * Инициализирует модуль.
         *
         * Метод имеет два интерфейса:
         * - Простой: на вход принимает 3 аргумента (название модуля, данные для инициализации, колбэк);
         * - Расширенный: на взод принмает 2 аргумента (объект в формате {type: "название_модуля", data: {}} и колбэк).
         *
         * См. примеры.
         *
         * @example
         * // Simple module init
         * slot.init('moduleName');
         *
         * @example
         * // Init module with some init data
         * slot.init('moduleName', {
         *     // Init data for module
         * });
         *
         * @example
         * // Init module with callback
         * slot.init('moduleName', function () {}
         *     // Some code here
         * );
         *
         * @example
         * // Init module with some init data and callback
         * slot.init('moduleName', {
         *     // Init data for module
         * }, function () {
         *     // Some code here
         * );
         *
         * @example
         * // Init module with some init data
         * slot.init({
         *     type: 'moduleName',
         *     data: {} // Init data for module
         * });
         *
         * @example
         * // Init module with some init data and callback
         * slot.init({
         *     type: 'moduleName',
         *     data: {} // Init data for module
         * }, function () {
         *     // Some code here
         * );
         *
         * @param {string} name - Тип модуля, например firmCard.
         * @param {Object} [data] - Данные для инициализации модуля, которые прилетят в инит модуля первым аргументом.
         * @param {Function} [callback] - Колбек, вызываемый инитом модуля асинхронно, или враппером синхронно,
         *                                если модуль синхронный и не имеет колбека в ините.
         */
        init: function(name, data, callback) {
            // Если слот умер - ничего инитить нет смысла, потому что слот умирает вместе с родительским модулем
            if (slot.stage & slot.STAGE_NOT_ALIVE) {
                return;
            }

            if (_.isObject(name)) { // Обработка расширенного интерфейса метода
                callback = data;

                var moduleConf = name;

                name = moduleConf.type;
                data = moduleConf.data;
            } else if (_.isFunction(data)) {
                callback = data;
                data = {};
            }

            var module = loadModule({ type: name, data: data });

            module.init(data, function(err) {
                var moduleName = name;

                if (err) {
                    module.dispose();
                } else {
                    if (module.slot.stage == slot.STAGE_INITED) { // На случай, если суицид модуля
                        var modules = slot.modules[moduleName];

                        // Если модуль такого типа уже есть, то преобразуем в массив
                        if (modules) {
                            if (!_.isArray(modules)) { // Если сейчас только 1 инстанс, и ещё не преобразовано в массив
                                slot.modules[moduleName] = [modules];
                            }

                            slot.modules[moduleName].push(module);
                        } else {
                            slot.modules[moduleName] = module;
                        }
                    }
                }

                if (callback) {
                    callback(err, module);
                }
            });

            return module;
        },

        /**
         * Палаллельная нициализация массива модулей.
         *
         * @param {Array} modules - Массив описаний инициализируемых модулей.
         * @param {Function} callback - Опциональный колбек, вызываемый после инициализации всех модулей.
         */
        initModules: function(modules, callback) {
            async.map(modules, slot.init, callback || _.noop);
        },

        initModulesSeries: function(modules, callback) {
            async.mapSeries(modules, slot.init, callback);
        },

        requireComponent: function(name, extraArgs) {
            var component,
                componentMeta = app.loadComponent(name);

            if (componentMeta.emitAbortablesBy) {
                component = app.newComponent(name, extraArgs);
                component.on(componentMeta.emitAbortablesBy, function(req) {
                    requests.push(req);
                });
                component.on('done', function(req) {
                    requests = _.without(requests, req);
                });
            } else {
                component = app.requireComponent(name, extraArgs);
            }
            return component;
        },

        clearRequests: function() {
            _.each(requests, function(req) {
                req.abort();
            });
            requests = [];
        },

        notify: _.partial(ensureFunction(app.notify), moduleId),

        /**
         * Рассылает сообщения всем потомкам.
         */
        broadcast: _.partial(ensureFunction(app.broadcast), moduleId),

        queryModules: _.partial(ensureFunction(app.queryModules), moduleId),

        block: _.partial(ensureFunction(app.block), moduleId),

        /**
         * @type {boolean}
         */
        isServer: app.isServer,

        /**
         * @type {boolean}
         */
        isClient: app.isClient,

        domBound: app.isBound,

        rerender: _.partial(ensureFunction(app.rerender), moduleId),

        rebind: function() {
            if (slot.isClient) {
                app.unbindEvents(moduleId);
                app.bindEvents(moduleId);
            }
        },

        element: _.partial(app.element, moduleId),

        bindEvents: _.partial(ensureFunction(app.bindEvents), moduleId),

        mod: _.partial(ensureFunction(app.mod), moduleId),

        /**
         * Возвращает дочерний модуль по айдишнику.
         */
        moduleById: _.partial(ensureFunction(app.getChildModuleWrapperById), moduleId),

        /**
         * @returns {string} Айдишник модуля.
         */
        moduleId: function() {
            return moduleId;
        },

        /**
         * Устанавливает таймаут привязанный к модулю.
         *
         * @param {Function} func
         * @param {int} delay
         */
        setTimeout: function(func, delay) {
            if (slot.stage & slot.STAGE_NOT_ALIVE) {
                return;
            }

            var timer = app.setTimeout(func, delay);

            if (timer) {
                timeouts.push(timer);
            }

            return timer;
        },

        /**
         * Отменяет ранее установленные для данного модуля таймауты.
         */
        clearTimeouts: function() {
            _.each(timeouts, clearTimeout);
        },

        /**
         * Устанавливает интервал привязанный к модулю.
         *
         * @param {Function} func
         * @param {int} delay
         */
        setInterval: function(func, delay) {
            var interval = app.setInterval(func, delay);

            if (interval) {
                intervals.push(interval);
            }

            return interval;
        },

        /**
         * Отменяет ранее установленные для данного модуля интервалы.
         */
        clearIntervals: function() {
            _.each(intervals, clearInterval);
        },

        registry: app.registry,

        raise: app.raise,

        onTransitionEnd: app.onTransitionEnd,

        self: function() {
            var descriptor = app.getModuleDescriptorById(moduleId);
            return descriptor && descriptor.instance;
        },

        /**
         * Регистритует функцию и возвращает триггер на её исполнение, не исполняет если модуль уже убит.
         *
         * @param {Function} fn
         * @returns {Function}
         */
        ifAlive: function(fn) {
            return function() {
                if (!(slot.stage & slot.STAGE_NOT_ALIVE)) {
                    fn.apply(this, arguments);
                }
            };
        },

        cookie: app.cookie
    };

    _.each(app.config['plugins'], function(name) {
        slot[name] = app[name];
    });

    return slot;
};
