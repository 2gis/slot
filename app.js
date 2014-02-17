/**
 * Оставлю этот камент здесь! Потом покажу сыну если что :)
 * Мы поехали в роддом! Кажется началось. надеюсь не в холостую
 */

var _ = require('underscore');

var utils = require('./utils'),
    injector = require('./injector'),
    env = require('./env'),
    templateProvider = require('./templateProvider'),
    modulesQuering = require('./modulesQuering'),
    smokesignals = envRequire('smokesignals'),
    namer = require('./namer'),
    config = require('./config');

module.exports = function() {
    var internals = {
            moduleInstances: {},
            ids: {}
        },
        queryModules = modulesQuering(internals),
        raised;

    var uniqueIdCounter = 0;

    function nextModuleId(parentId) {
        var key = parentId || 'root';
        if (!(key in internals.ids)) {
            internals.ids[key] = 1;
        }
        var nextId = internals.ids[key]++;
        return _.compact([parentId, nextId]).join('-');
    }

    var registry = {
        escModulesOrder: [] // список модулей которые будем закрывать по esc
    };

    /**
     * Получить модификаторы.
     * Только на клиенте, т.к. используем dom элемент.
     *
     * @param {object} moduleWrapper
     * @returns {_.map|*}
     */
    function getModificators(moduleWrapper) {
        var modificators = {};

        function collectModificators(element) {
            if (!_.isObject(element[0])) return;

            var elementClasses = element[0].className.split(' ');

            _.each(elementClasses, function(className) {
                if (namer.isClassAModificator(moduleWrapper.type, className)) {
                    modificators = _.extend(modificators, namer.getModificatorFromClass(className));
                }
            });
        }

        collectModificators(moduleWrapper.block());

        return modificators;
    }

    /**
     * Выставляем версию браузера
     *
     * @param {string} ua
     */
    function getBrowser(ua) {
        // Выставляем версию браузера
        var UAParser = require('ua-parser-js'),
            parser = new UAParser();

        parser.setUA(ua);

        return parser.getResult();
    }

    var app = {
        modules: {},
        components: {},
        config: config,
        stateNotRendered: false,
        server: true,

        stateRendered: function() {
            var notRendered = (!app.server && history.emulate) || app.stateNotRendered;

            return !app.isBound() && !notRendered;
        },

        isBound: function() {
            return app._stage == 'bind';
        },

        require: function(path) {
            return env.require(path);
        },

        resolveEntryPoint: function(req, appState) {
            var url = req.url,
                name = app.config.mainModule,
                slug = url.split('/')[0];

            if (DEBUG && (app.config.makeups && slug in app.config.makeups)) {
                name = app.config.makeups[slug];
            }
            if (app.config.isLandingPage(req, appState)) {
                name = 'landingPage';
            }

            return app.loadModule({type: name});
        },

        init: function(req, callback) {
            app._stage = 'init';

            registry.host = req.host;
            registry.protocol = req.protocol;
            registry.port = req.port;
            registry.ip = req.ip;
            registry.ua = getBrowser(req.ua);
            registry[config['authApi.cookieName']] = req[config['authApi.cookieName']];

            var appState = app.requireComponent('appState'),
                middleware = app.requireComponent('middleware');

            middleware.setup();

            // Makeup mode
            if (!DEBUG || !app.historyDisabled) {
                appState.parse(req, initContinue);
            } else {
                initContinue();
            }

            function initContinue() {
                try {
                    var mainModule = app.mainModule = app.resolveEntryPoint(req, appState);

                    mainModule.init(req, function(err) {
                        callback(err, mainModule);
                    });
                } catch (ex) {
                    callback(ex);
                }
            }
        },

        mod: function(moduleId, modificators) {
            var module = app.getModuleById(moduleId);

            var oldMods = module.mods,
                newMods = {},
                block;

            _.each(modificators, function(val, key) {
                newMods[key] = val !== null ? String(val) : null;
            });

            _.each(newMods, function(val, key) {
                var oldModVal = oldMods[key];

                if (oldModVal !== val) {

                    if (app.isClient) { // или == 'bind' ?
                        block = app.block(moduleId);

                        var oldModClass;

                        // @TODO удалить когда весь CSS переедет на BEVIS
                        oldModClass = namer.moduleModificatorClassTemp(module.type, key, oldModVal);
                        if (oldModClass) block.removeClass(oldModClass);

                        oldModClass = namer.moduleModificatorClass(key, oldModVal);

                        if (oldModClass) block.removeClass(oldModClass);

                        var newModClass;

                        // @TODO удалить когда весь CSS переедет на BEVIS
                        if (val != null) {
                            newModClass = namer.moduleModificatorClassTemp(module.type, key, val);
                            block.addClass(newModClass);
                        }

                        newModClass = namer.moduleModificatorClass(key, val);

                        if (newModClass) block.addClass(newModClass);
                    }

                    var handlers = module.instance.modHandlers;
                    if (handlers && handlers[key]) { // Вызов деклараций установки или удаления модификатора
                        if (val != null) {
                            if (handlers[key].set) handlers[key].set.call(module.instance, val);
                        } else {
                            if (handlers[key].remove) handlers[key].remove.call(module.instance);
                        }

                    }

                    if (DEBUG) {
                        /**
                         * modHandler, который вызывается при изменении ЛЮБОГО модификатора
                         *
                         * Пример использования:
                         *
                         * modHandlers: {
                         *     ...
                         *     _any: function(key, val) {
                         *         shmonsole.log(key, val);
                         *     }
                         * }
                         */
                        if (handlers && handlers._any) {
                            if (handlers._any.change) handlers._any.change.call(module.instance, key, val);
                        }
                    }
                }
            });

            _.extend(module.mods, newMods);

            return module.mods;
        },

        closestModule: function(moduleId, type) {
            var module = internals.moduleInstances[moduleId];
            while (module && module.type != type) {
                module = internals.moduleInstances[module.parentId];
            }

            if (module) {
                return module;
            } else {
                return false;
            }
        },

        /**
         * Посылает сообщение модулям-родителям (антоним broadcast).
         *
         * @param {string} moduleId
         * @param message
         * @returns {*}
         */
        notify: function (moduleId, message) {
            var args = [].slice.call(arguments, 2),
                activeModule,
                notifiedModule = internals.moduleInstances[moduleId], // Модуль, пославший нотифай
                currentModuleId = notifiedModule.parentId,
                retValue;

            var needStop = false;

            var event = {
                sender: notifiedModule,
                stop: function() {
                    needStop = true;
                }
            };

            while (currentModuleId) {
                activeModule = internals.moduleInstances[currentModuleId]; // Текущий модуль, у которого будем искать диспетчеры

                var module = activeModule.instance,
                    dispatcher = module.dispatcher;

                if (dispatcher) {
                    var actions = _.compact(_.map(['*', notifiedModule.type], function(type) { // Выбираем существующие действия диспетчера по маскам *: и type:
                        activeModule.slot.sender = notifiedModule;
                        return dispatcher[type + ':' + message];
                    }));

                    _.each(actions, function(action) { // Выполняем действия диспетчера
                        var result = action.apply(event, args);

                        if (retValue === undefined) {
                            retValue = result;
                        }
                    });
                }

                if (needStop) break;

                currentModuleId = activeModule.parentId; // Ползём вверх по иерархии модулей
            }

            return retValue;
        },

        newComponent: function(name, extraArgs) {
            extraArgs = extraArgs || [];
            var componentConstructor = app.require('components/' + name + '/' + name);

            return app.invoke(componentConstructor, [app].concat(extraArgs));
        },

        requireComponent: function(name, extraArgs) {
            if (!app.components[name]) {
                app.components[name] = app.newComponent(name, extraArgs);
            }
            return app.components[name];
        },

        queryModules: queryModules,

        processModules: function(moduleId, selector, handler, inclusive) {
            var modules = queryModules(moduleId, selector, inclusive);
            _.each(modules, function(module) {
                handler(module.instance, module);
            });
        },

        /**
         * Отправляет сообщение дочерним модулям (антоним notify).
         * message состоит из двух частей - `query:method`, где query - селектор для модулей,
         * method - метод который нужно вызвать у модулей.
         *
         * query - поддерживает каскадность и предикаты, например:
         *
         * `slot.broadcast('frame[:active=true] searchResults[isActive] miniCard:unselect');`
         *
         * Предикаты начинающиеся c `:` относятся к модификаторам,
         * остальные предикаты относятся к интерфейсным методам, т.е:
         *
         * `frame[:active=true]` - берет только фреймы с модификатором active равным true
         * `searchResults[isActive]` - берет только те модули searchResults у которых интерфейсный метод isActive вернет true
         *
         * К интерфейсным методам можно применять параметры
         *
         * `filters[hasContext=5]` - берет только те модули filters у которых интерфейсный метод hasContext(5) вернет true
         *
         * Если модулей несколько, то возвращается значение последнего модуля. Если модулей нет undefined
         *
         * @returns {*}
         */
        broadcast: function (moduleId, message) {
            var args = [].slice.call(arguments, 2),
                lastIndexOfDelim = message.lastIndexOf(':'),
                selector = message.substr(0, lastIndexOfDelim),
                action = message.substr(lastIndexOfDelim + 1),
                retValue;

            app.processModules(moduleId, selector, function(instance) {
                if (instance.interface) {
                    var handler = instance.interface[action];
                    if (handler) {
                        retValue = handler.apply(instance.interface, args);
                    }
                }
            });
            return retValue;
        },

        requireModuleJs: function(moduleName, fileName) {
            fileName = fileName || moduleName;

            var fn = 'modules/' + moduleName + '/' + fileName;

            try {
                return app.require(fn);
            } catch (ex) {
                return null;
            }
        },

        invoke: function(fn, args, provider, self) {
            provider = provider || app.requireComponent;

            return injector.invoke(fn, args, provider, self);
        },

        loadModule: function(data) {
            var parentId = data.parentId,
                moduleId = data.id || nextModuleId(parentId),
                moduleName = data.type;

            var slotConstructor = require('./slot'),
                moduleConstructor = app.requireModuleJs(moduleName),
                slot = app.invoke(slotConstructor, [app, {
                    moduleId: moduleId,
                    templates: wrapTemplates(moduleName, moduleId)
                }]);

            if (!_.isFunction(moduleConstructor)) { // если возвращает не функцию — ругаемся
                throw new Error('Bad module: ' + moduleName);
            }

            function wrapTemplates(moduleName, moduleId) {
                var templates = templateProvider.getTemplatesForModule(moduleName);
                var wrappedTemplates = {};

                _.each(templates, function(template, templateName) {
                    wrappedTemplates[templateName] = function(templateData, options) {
                        if (!templateData) {
                            templateData = {};
                        }

                        templateData.module = {
                            id: moduleId,
                            type: moduleName
                        };

                        var html = template.call(this, templateData, options);

                        return html;
                    };
                });

                return wrappedTemplates;
            }

            var module = app.invoke(moduleConstructor, [slot], slot.requireComponent);
            module.uniqueId = moduleId;
            module.type = moduleName;

            var moduleInstance = {
                id: moduleId,
                instance: module,
                slot: slot,
                type: moduleName,
                parentId: parentId,
                children: data.children || [],
                container: data.container,
                mods: data.mods || {}
            };

            internals.moduleInstances[moduleId] = moduleInstance;

            if (parentId) {
                internals.moduleInstances[parentId].children.push(moduleId);
            }

            var moduleWrapperConstructor = require('./moduleWrapper'),
                moduleWrapper = moduleWrapperConstructor(app, module, slot);

            var dispose = function() {
                if (!moduleWrapper || moduleWrapper.disposing) return;
                moduleWrapper.disposing = true;

                slot.clearTimeouts();
                slot.clearIntervals();
                slot.clearRequests();
                if (app.isBound()) {
                    app.unbindEvents(moduleId);
                }
                var children = internals.moduleInstances[moduleId].children;
                if (children) {
                    _.each(children, function(childrenId) {
                        internals.moduleInstances[childrenId].wrapper.dispose();
                    });
                }
                if (module.dispose) module.dispose();

                if (parentId) {
                    internals.moduleInstances[parentId].children = _.without(internals.moduleInstances[parentId].children, moduleId);
                    delete internals.moduleInstances[parentId].slot.modules[moduleName];
                }
                delete internals.moduleInstances[moduleId];
                if (slot.isClient) {
                    slot.block().remove();
                }
                moduleWrapper.disposed = true;
                slot.disposed = true;
                moduleWrapper = moduleInstance = module = slot = null;
            };
            moduleInstance.wrapper = moduleWrapper;
            moduleWrapper.dispose = slot.dispose = dispose;
            moduleWrapper.viewContext = module.viewContext;

            // На клиенте собираем модификаторы, расставленные при рендеринге на сервере.
            if (slot.isClient) {
                slot.mod(getModificators(moduleWrapper));
            }

            // Кастомный блок для модуля
            if (module.block) {
                slot.mod({module: moduleWrapper.type});
            }

            return moduleWrapper;
        },

        getModuleById: function(moduleId) {
            var module = internals.moduleInstances[moduleId];

            if (!module) console.error('No module with moduleId ' + moduleId + ' found. All modules: ', internals.moduleInstances, '1');

            return module;
        },

        getChildModuleWrapperById: function(moduleId, childModuleId) {
            var moduleInstance = app.getModuleById(childModuleId);
            if (moduleInstance.parentId == moduleId) {
                return moduleInstance.wrapper;
            }
        },

        isGrym: env.isGrym,
        isServer: env.isServer,
        isClient: env.isClient,

        setTimeout: function(func, delay) {
            if (app.isServer) {
                func();
            } else {
                return setTimeout(func, delay);
            }
        },

        setInterval: function(func, delay) {
            return setInterval(func, delay);
        },

        uniqueId: function(prefix) {
            var id = uniqueIdCounter++;

            return (prefix || '') + id;
        },

        registry: function(key, def) {
            if (!registry[key]) {
                registry[key] = def == null ? {} : def;
            }

            return registry[key];
        },

        /**
         * Кинуть некоторое исключение которое должно обработаться управляющим кодом аппликейшена
         *
         * Например raise(404) на сервере показывает глобальную 404 страницу, т.е. данная функция некоторый
         * аналог конструкции throw, но она не подходит в силу обрыва контекста исполнения при вызове асинхронных
         * функций в javascript'e
         * @param value объект исключения
         */
        raise: function(value) {
            raised = value;
        },

        /**
         * Получить значение исключения
         */
        raised: function() {
            return raised;
        },

        removeRegistry: function(key) {
            delete registry[key];
        },

        // публикуем функцию для тестов
        getModificators: getModificators
    };

    if (DEBUG) {
        env.globals().app = app;

        app.modulesByType = function(type) {
            return _.filter(internals.moduleInstances, function(instance) {
                return instance.type == type;
            });
        };

        app.findModule = function(type) {
            return app.modulesByType(type)[0];
        };
    }

    return {
        instance: app,
        internals: internals
    };
};
