/**
 * Оставлю этот камент здесь! Потом покажу сыну если что :)
 * Мы поехали в роддом! Кажется началось. надеюсь не в холостую
 */

var _ = require('lodash');

var injector = require('./injector'),
    env = require('./env'),
    templateProvider = require('./templateProvider'),
    modulesQuering = require('./modulesQuering'),
    smokesignals = envRequire('smokesignals'),
    namer = require('./namer'),
    config = require('./config');

require('./templateHelpers'); // регистрирует хелперы сам, как только будет передан handlebars

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

    var registryData = {};

    /**
     * @param {string} name
     * @param {*} [defaultValue={}]
     * @returns {*}
     */
    function registry(name, defaultValue) {
        if (registryData.hasOwnProperty(name)) {
            return registryData[name];
        }

        if (defaultValue === undefined) {
            defaultValue = {};
        }

        return registryData[name] = defaultValue;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    registry.has = function(name) {
        return registryData.hasOwnProperty(name);
    };

    /**
     * @param {string} name
     * @returns {*}
     */
    registry.get = function(name) {
        return registryData.hasOwnProperty(name) ? registryData[name] : undefined;
    };

    /**
     * @param {string} name
     * @param {*} value
     */
    registry.set = function(name, value) {
        registryData[name] = value;
    };

    /**
     * @param {string} name
     */
    registry.remove = function(name) {
        delete registryData[name];
    };

    /**
     * @param {Object} data
     */
    registry.setup = function(data) {
        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                registryData[name] = data[name];
            }
        }
    };

    /**
     * Получить модификаторы.
     * Только на клиенте, т.к. используем dom элемент.
     *
     * @param {Object} moduleWrapper
     * @returns {Object}
     */
    function getModificators(moduleWrapper) {
        var el = moduleWrapper.block()[0];
        return el ? namer.getModificatorsFromClassName(el.className) : {};
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
                app.emit('resolveDevPage', name);
            }
            if (app.config.isLandingPage(req)) {
                name = 'landingPage';
            }
            return app.loadModule({type: name});
        },

        init: function(req, callback) {
            app._stage = 'init';

            var data = {
                host: req.host,
                protocol: req.protocol,
                port: req.port,
                ip: req.ip,
                ua: getBrowser(req.ua)
            };

            data[config['authApi.cookieName']] = req[config['authApi.cookieName']];

            registry.setup(data);

            var appState = app.requireComponent('appState'),
                middleware = app.requireComponent('middleware');

            middleware.setup();

            app.emit('init');

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

            if (modificators) { // Без аргумента работает как геттер
                var oldMods = _.clone(module.mods),
                    newMods = _.clone(modificators),
                    block;

                _.extend(module.mods, newMods);

                _.each(newMods, function(val, key) {
                    var oldModVal = oldMods[key];

                    if (oldModVal !== val) {

                        if (app.isClient) { // или == 'bind' ?
                            block = app.block(moduleId);

                            var oldModClass = namer.modificatorClass(key, oldModVal);

                            if (oldModClass) block.removeClass(oldModClass);

                            var newModClass = namer.modificatorClass(key, val);

                            if (newModClass) block.addClass(newModClass);
                        }

                        var handlers = module.instance.modHandlers;
                        if (handlers && handlers[key]) { // Вызов обработчиков установки или удаления модификатора
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
                             *         shmonsole.loh(key, val);
                             *     }
                             * }
                             */
                            if (handlers && handlers._any) {
                                if (handlers._any.change) handlers._any.change.call(module.instance, key, val);
                            }
                        }
                    }
                });
            }

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
                    activeModule.slot.sender = notifiedModule;
                    var actions = _.flatten(_.compact([dispatcher['*:' + message], dispatcher[notifiedModule.type + ':' + message]]));

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

        loadComponent: function(name) {
            return app.require('components/' + name + '/' + name);
        },

        newComponent: function(name, extraArgs) {
            extraArgs = extraArgs || [];
            var componentConstructor = app.loadComponent(name);

            return app.invoke(componentConstructor, [app].concat(extraArgs));
        },

        requireComponent: function(name, extraArgs) {
            var componentConstructor = app.loadComponent(name);

            var identityKey = name;
            if (componentConstructor.identity) {
                identityKey = componentConstructor.identity.apply(componentConstructor, [name].concat(extraArgs));
            }
            if (!app.components[identityKey]) {
                app.components[identityKey] = app.newComponent(name, extraArgs);
            }
            return app.components[identityKey];
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

            return app.require(fn);
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
                    templates: templateProvider.forModule(moduleName)
                }]);

            if (!_.isFunction(moduleConstructor)) { // если возвращает не функцию — ругаемся
                throw new Error('Bad module: ' + moduleName);
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

            // Модуль убивается (анбиндинг, удаление асинхронных функций), но сохраняется в дом-дереве
            var kill = function() {
                if (!moduleWrapper || moduleWrapper.stage == 'killed') return;
                moduleWrapper.stage = slot.stage = 'killed';

                slot.clearTimeouts();
                slot.clearIntervals();
                slot.clearRequests();
                if (app.isBound()) {
                    app.unbindEvents(moduleId);
                }
                var children = internals.moduleInstances[moduleId].children;
                if (children) {
                    _.each(children, function(childrenId) {
                        internals.moduleInstances[childrenId].wrapper.kill();
                    });
                }
            };

            // Модуль удаляется из дом-дерева. Необходимо сначала его убить.
            var remove = function() {
                if (slot.isClient) {
                    slot.block().remove();
                }
                moduleWrapper.stage = slot.stage = 'disposed'; // Сомнительно, ведь дальше враппер и слот удаляются

                var children = internals.moduleInstances[moduleId].children;
                if (children) {
                    _.each(children, function(childrenId) {
                        internals.moduleInstances[childrenId].wrapper.remove();
                    });
                }

                if (module.dispose) module.dispose();

                if (parentId) {
                    internals.moduleInstances[parentId].children = _.without(internals.moduleInstances[parentId].children, moduleId);
                    delete internals.moduleInstances[parentId].slot.modules[moduleName];
                }
                delete internals.moduleInstances[moduleId];
                moduleWrapper = moduleInstance = module = slot = null;
            }

            var dispose = function() {
                if (moduleWrapper) { // Могли вызвать повторно
                    moduleWrapper.kill();
                    moduleWrapper.remove();
                }
            };

            moduleInstance.wrapper = moduleWrapper;
            moduleWrapper.kill = slot.kill = kill;
            moduleWrapper.remove = slot.remove = remove;
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

            if (!module) {
                console.error('No module with moduleId ' + moduleId + ' found.');
            }

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

        registry: registry,

        /**
         * Для переопределения в конечных продуктах
         * вызывается на каждом новом слоте
         * @param slot
         */
        setupSlot: function(slot) {

        },

        /**
         * Кинуть некоторое исключение которое должно обработаться управляющим кодом аппликейшена
         *
         * Например raise(404) на сервере показывает глобальную 404 страницу, т.е. данная функция некоторый
         * аналог конструкции throw, но она не подходит в силу обрыва контекста исполнения при вызове асинхронных
         * функций в javascript'e
         * А как работает? Тупо смотрится значение raised в server.js
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

        /**
         * Чтение или запись кук. Работает как на сервере, так и на клиенте
         * Интерфейс как у jQuery
         * Подразумевается, что на клиенте есть jQuery
         */
        cookie: function(key, value, params) {
            params = params || {};

            _.defaults(params, {
                path: '/',
                expires: 365
            });

            if (app.isClient) {
                return $.cookie(key, value, params);
            } else {
                var cookie = {
                    key: value
                };

                if (typeof value != 'undefined') {
                    if (params.expires) {
                        params.expires = new Date(Date.now() + params.expires * 24 * 60 * 60 * 1000) // jquery days to express ms
                    }

                    app.emit('cookie', key, value, params);
                }

                return cookie;
            }
        },

        removeCookie: function(key) {
            if (app.isClient) {
                return $.removeCookie(key);
            } else {
                app.emit('cookie', key, undefined); // undefined -> clearCookie
            }
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
        instance: smokesignals.convert(app),
        internals: internals
    };
};
