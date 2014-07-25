var async = require('async'),
    _ = require('lodash'),
    smokesignals = envRequire('smokesignals');

module.exports = function(app, params) {
    var moduleId = params.moduleId,
        timeouts = [], // Массив всех таймаутов для текущей копии модуля
        requests = [], // Массив запросов к апи
        intervals = []; // Массив всех интервалов для текущей копии модуля

    function loadModule(conf) {
        // новый объект необязательно создавать
        // сейчас нет и скорее всего не будет ситуации когда один и тот же конфиг передается на инициализацию разным слотам
        // даже в этом случае использование parentId далее происходит через копирование и опасности никакой нет
        conf.parentId = moduleId;
        return app.loadModule(conf);
    }

    function ensureFunction(f) {
        return _.isFunction(f) ? f : function() {};
    }

    var slot = {
        templates: params.templates,
        modules: {},
        config: app.config,

        addTransition: app.addTransition,
        runInQueue: app.runInQueue,

        /**
         * @deprecated. Use 'init' instead
         */
        initModule: function(moduleConf, callback) {
            return this.init(moduleConf, callback);
        },

        /**
         * Инициализирует модуль
         *
         * @param name {string} - тип модуля, например firmCard
         * @param data {string} - данные для инициализации модуля, которые прилетят в инит модуля первым аргументом. Опционально
         * @param callback {Function} - колбек, вызываемый инитом модуля асинхнонно, или враппером синхронно, если модуль синхронный и не имеет колбека в ините. Опционально
         */
        init: function(name, data, callback) {
            var moduleConf;

            // Если слот умер - ничего инитить нет смысла,
            // потому что слот умирает вместе с родительским модулем
            if (slot.stage == 'disposed' || slot.stage == 'killed') return;

            // Старый интерфейс
            if (_.isObject(name)) {
                callback = data;

                var moduleConf = name;

                name = moduleConf.type;
                data = moduleConf.data;
            }

            var module = loadModule({ type: name, data: data });

            module.init(data, function(err) {
                var moduleName = name;

                if (err) {
                    module.dispose();
                } else {
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

                if (callback) {
                    callback(err, module);
                }
            });

            return module;
        },

        initModules: function(modules, callback) {
            async.map(modules, slot.init, callback);
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

        // Рассылаем сообщения всем дочерним, и внучатым модулям :)
        broadcast: _.partial(ensureFunction(app.broadcast), moduleId),

        queryModules: _.partial(ensureFunction(app.queryModules), moduleId),

        block: _.partial(ensureFunction(app.block), moduleId),

        isServer: app.isServer,

        isClient: app.isClient,

        isGrym: app.isGrym,

        domBound: app.isBound,

        /**
         * Отвечает на вопрос отрисованы ли в dom-дереве модули находящиеся в начальном стейте
         * @returns {boolean}
         */
        stateRendered: app.stateRendered,

        rerender: _.partial(ensureFunction(app.rerender), moduleId),

        rebind: function() {
            if (slot.isClient) {
                app.unbindEvents(moduleId);
                app.bindEvents(moduleId);
            }
        },

        element: _.partial(ensureFunction(app.element), moduleId),

        bindEvents: _.partial(ensureFunction(app.bindEvents), moduleId),

        mod: _.partial(ensureFunction(app.mod), moduleId),

        // Возвращает дочерний модуль по айдишнику
        moduleById: _.partial(ensureFunction(app.getChildModuleWrapperById), moduleId),

        moduleId: function() {
            return moduleId;
        },

        wrapData: function(type, data) {
            var args = [].slice.call(arguments, 1),
                modelConstructor = function() {},
                model = app.require('models/' + type);

            modelConstructor.prototype = model.prototype;

            var wrapper = function() {
                var obj = new modelConstructor();
                model.apply(obj, arguments);
                return obj;
            };

            return args.length ? wrapper.apply(null, args) : wrapper;
        },

        // Выставить таймаут для возможности его автоматической отмены при диспозе.
        setTimeout: function(func, delay) {
            var timer = app.setTimeout(func, delay);

            if (timer) timeouts.push(timer);

            return timer;
        },

        // Отменить все таймауты для данного модуля. Вызывается при диспозе.
        clearTimeouts: function() {
            _.each(timeouts, function(timer) {
                clearTimeout(timer);
            });
        },

        setInterval: function(func, delay) {
            var interval = app.setInterval(func, delay);

            if (interval) intervals.push(interval);

            return interval;
        },

        clearIntervals: function() {
            _.each(intervals, function(interval) {
                clearInterval(interval);
            });
        },

        uniqueId: app.uniqueId,

        registry: app.registry,

        removeRegistry: app.removeRegistry,

        raise: app.raise,

        onTransitionEnd: app.onTransitionEnd,

        closestModule: _.partial(ensureFunction(app.closestModule), moduleId),

        // Регистритует функцию и возвращает триггер на её исполнение, не исполняет если модуль уже убит
        regFn: function(fn) {
            function slotRegFn() {
                if (slot.stage != 'killed' && slot.stage != 'disposed') {
                    fn.apply(this, arguments);
                }
            }

            return slotRegFn;
        },

        /**
         * Заглушка для расширения хелперов в moduleWrapper
         */
        extendHelpers: function() {},

        /**
         * Заглушка для расширения партиалов в moduleWrapper
         */
        extendPartials: function() {},

        cookie: app.cookie
    };

    app.setupSlot(slot);

    return slot;
};
