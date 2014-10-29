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
            moduleDescriptors: {},
            ids: {}
        },
        queryModules = modulesQuering(internals),
        raised,
        cookies; // Куки, прилетевшие в инит приложения (используется на сервере)

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
        if (!registryData.hasOwnProperty(name)) {
            if (typeof defaultValue == 'undefined') {
                defaultValue = {};
            }

            registryData[name] = defaultValue;
        }

        return registryData[name];
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

        /**
         * Отвечает на вопрос нужно ли отрисовывать стэйт в случае инита приложения
         * (когда приложение уже проиничино есс-но вернет true)
         * @returns {boolean}
         */
        needRenderState: function() {
            return app.isBound() || app.stateNotRendered;
        },

        isBound: function() {
            return app._stage == 'bind';
        },

        require: function(path) {
            return env.require(path);
        },

        resolveEntryPoint: function(req, appState) {
            req = req || {};

            var name;

            if (typeof app.config.mainModule == 'function') {
                name = app.config.mainModule(req);
            } else {
                name = app.config.mainModule;
            }

            return app.loadModule({ type: name });
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

            registry.setup(data);

            cookies = req.cookies;

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
            var descriptor = app.getModuleDescriptorById(moduleId);

            if (modificators) { // Без аргумента работает как геттер
                var oldMods = _.clone(descriptor.mods),
                    newMods = _.clone(modificators),
                    block;

                _.extend(descriptor.mods, newMods);

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

                        var handlers = descriptor.moduleConf.modHandlers;
                        if (handlers && handlers[key]) { // Вызов обработчиков установки или удаления модификатора
                            if (val != null) {
                                if (handlers[key].set) handlers[key].set.call(descriptor.moduleConf, val);
                            } else {
                                if (handlers[key].remove) handlers[key].remove.call(descriptor.moduleConf);
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
                                if (handlers._any.change) handlers._any.change.call(descriptor.moduleConf, key, val);
                            }
                        }
                    }
                });
            }

            return descriptor.mods;
        },

        /**
         * Возвращает на сервере объект с методом mod для простановки модификаторов элементу.
         * Чтобы модификаторы выставились не забудьте воспользоваться хелпером mods.
         * @param {String} moduleId
         * @param {String} elementName
         * @returns {{mod: Function}}
         */
        element: function(moduleId, elementName) {
            var descriptor = app.getModuleDescriptorById(moduleId);

            return {
                mod: function(mods) {
                    var elemMods = (descriptor.elementsMods[elementName] = descriptor.elementsMods[elementName] || {});
                    if (mods != null) {
                        _.extend(elemMods, mods);
                    }
                    return elemMods;
                }
            };
        },

        /**
         * Посылает сообщение модулям-родителям (антоним broadcast).
         *
         * @param {string} moduleId
         * @param message
         * @returns {*}
         */
        notify: function(moduleId, message) {
            var args = [].slice.call(arguments, 2),
                notifier = internals.moduleDescriptors[moduleId]; // Модуль, пославший нотифай

            if (!notifier) {
                throw new Error("app.notify: module with id " + moduleId + " doesn't exists, message: " + message);
            }

            var currentModuleId = notifier.parentId,
                retValue;

            var needStop = false;

            var event = {
                sender: notifier,
                stop: function() {
                    needStop = true;
                }
            };

            var currentDescriptor;

            while (currentModuleId) {
                currentDescriptor = internals.moduleDescriptors[currentModuleId]; // Текущий модуль, у которого будем искать диспетчеры

                var module = currentDescriptor.moduleConf,
                    dispatcher = module.dispatcher;

                if (dispatcher) {
                    currentDescriptor.slot.sender = notifier;
                    var actions = _.flatten(_.compact([dispatcher['*:' + message], dispatcher[notifier.type + ':' + message]]));

                    _.each(actions, function(action) { // Выполняем действия диспетчера
                        var result = action.apply(event, args);

                        if (retValue === undefined) {
                            retValue = result;
                        }
                    });
                }

                if (needStop) break;

                currentModuleId = currentDescriptor.parentId; // Ползём вверх по иерархии модулей
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
            var moduleDescriptors = queryModules(moduleId, selector, inclusive);
            _.each(moduleDescriptors, function(moduleDescriptor) {
                handler(moduleDescriptor.instance, moduleDescriptor);
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
        broadcast: function(moduleId, message) {
            var args = [].slice.call(arguments, 2),
                lastIndexOfDelim = message.lastIndexOf(':'),
                selector = message.substr(0, lastIndexOfDelim),
                action = message.substr(lastIndexOfDelim + 1),
                retValue;

            app.processModules(moduleId, selector, function(moduleInstance) {
                if (moduleInstance.interface) {
                    var handler = moduleInstance.interface[action];
                    if (handler) {
                        retValue = handler.apply(moduleInstance.interface, args);
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
                moduleJs = app.requireModuleJs(moduleName),
                slot = app.invoke(slotConstructor, [app, {
                    moduleId: moduleId,
                    templates: templateProvider.forModule(moduleName)
                }]);

            if (!_.isFunction(moduleJs)) { // если возвращает не функцию — ругаемся
                throw new Error('Bad module: ' + moduleName);
            }

            var moduleConf = app.invoke(moduleJs, [slot], slot.requireComponent);
            moduleConf.uniqueId = moduleId;
            moduleConf.type = moduleName;

            var moduleDescriptor = {
                id: moduleId,
                moduleConf: moduleConf,
                slot: slot,
                type: moduleName,
                parentId: parentId,
                children: data.children || [],
                container: data.container,
                mods: data.mods || {}, // модификаторы блока
                elementsMods: {} // модификаторы элементов
            };

            internals.moduleDescriptors[moduleId] = moduleDescriptor;

            if (parentId) {
                internals.moduleDescriptors[parentId].children.push(moduleId);
            }

            var moduleConstructor = require('./moduleConstructor'),
                moduleInstance = moduleConstructor(app, moduleConf, slot);

            app.fetchTmplHelpers(slot);

            // Модуль убивается (анбиндинг, удаление асинхронных функций), но сохраняется в дом-дереве
            var kill = function() {
                if (!moduleInstance || slot.stage == slot.STAGE_KILLED) return;
                slot.stage = slot.STAGE_KILLED;

                slot.clearTimeouts();
                slot.clearIntervals();
                slot.clearRequests();
                if (app.isBound()) {
                    app.unbindEvents(moduleId);
                }

                // Убиваем ссылку на модуль из родительского slot.modules
                var parentId = internals.moduleDescriptors[moduleId].parentId;
                if (parentId) {
                    var parent = internals.moduleDescriptors[parentId];
                    var childrenOfParent = parent.slot.modules[moduleInstance.type];

                    if (_.isObject(childrenOfParent)) {
                        delete parent.slot.modules[moduleInstance.type];
                    } else if (_.isArray(childrenOfParent)) {
                        _.remove(childrenOfParent, function(child) { // Удаляем из массива элемент с таким id-шником
                            return child.id() == moduleId;
                        });

                        if (childrenOfParent.length == 0) {
                            delete parent.slot.modules[moduleInstance.type];
                        }
                    }
                }

                // Убиваем все дочерние модули
                var children = internals.moduleDescriptors[moduleId].children;
                if (children) {
                    _.each(children, function(childId) {
                        internals.moduleDescriptors[childId].instance.kill();
                    });
                }
            };

            // Модуль удаляется из дом-дерева. Необходимо сначала его убить.
            var remove = function() {
                if (slot.isClient) {
                    slot.block().remove();
                }
                slot.stage = slot.STAGE_DISPOSED;

                var children = internals.moduleDescriptors[moduleId].children;
                if (children) {
                    _.each(children, function(childId) {
                        internals.moduleDescriptors[childId].instance.remove();
                    });
                }

                if (moduleConf.dispose) moduleConf.dispose();

                app.emit('moduleDisposed', moduleDescriptor);

                if (parentId) {
                    internals.moduleDescriptors[parentId].children = _.without(internals.moduleDescriptors[parentId].children, moduleId);
                    delete internals.moduleDescriptors[parentId].slot.modules[moduleName];
                }
                delete internals.moduleDescriptors[moduleId];
                moduleInstance = moduleDescriptor = moduleConf = slot = null;
            };

            var dispose = function() {
                if (moduleInstance) { // Могли вызвать повторно
                    moduleInstance.kill();
                    moduleInstance.remove();
                }
            };

            moduleDescriptor.instance = moduleInstance;
            moduleInstance.kill = slot.kill = kill;
            moduleInstance.remove = slot.remove = remove;
            moduleInstance.dispose = slot.dispose = dispose;
            moduleInstance.viewContext = moduleConf.viewContext;

            // На клиенте собираем модификаторы, расставленные при рендеринге на сервере.
            if (slot.isClient) {
                slot.mod(getModificators(moduleInstance));
            }

            // Кастомный блок для модуля
            if (moduleConf.block) {
                slot.mod({module: moduleInstance.type});
            }

            app.emit('moduleLoaded', moduleDescriptor);

            return moduleInstance;
        },

        /**
         * Возвращает дескриптор модуля по его id
         * @param  {String} moduleId - id модуля, который будет искаться в moduleDescriptors
         * @return {Object} - дескриптор найденного объекта
         */
        getModuleDescriptorById: function(moduleId) {
            var descriptor = internals.moduleDescriptors[moduleId];

            if (!descriptor) {
                console.error('No module with moduleId ' + moduleId + ' found.');
            }

            return descriptor;
        },

        getChildModuleWrapperById: function(moduleId, childModuleId) {
            var moduleDescriptor = app.getModuleDescriptorById(childModuleId);
            if (moduleDescriptor.parentId == moduleId) {
                return moduleDescriptor.instance;
            }
        },

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
            uniqueIdCounter = uniqueIdCounter + 1;

            return (prefix || '') + uniqueIdCounter;
        },

        registry: registry,

        /**
         * Вызывается на каждом новом слоте
         *
         * @param {Object} slot
         *
         * # Для переопределения в конечных продуктах
         */
        setupSlot: function(slot) {

        },

        /**
         * Собирает кастомные template helpers
         * Вызывается после создания каждого нового moduleWrapper
         *
         * @param {Object} slot
         *
         * # Для переопределения в конечных продуктах
         */
        fetchTmplHelpers: function(slot) {

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
                if (typeof value != 'undefined') {
                    if (params.expires) {
                        params.expires = new Date(Date.now() + params.expires * 24 * 60 * 60 * 1000); // Days → milliseconds
                    }

                    app.emit('cookie', key, value, params);
                } else {
                    value = cookies[key]; // Извлечь значение куки key на сервере из запроса клиента
                }

                return value;
            }
        },

        removeCookie: function(key) {
            if (app.isClient) {
                return $.removeCookie(key);
            } else {
                app.emit('removeCookie', key);
            }
        },

        // публикуем функцию для тестов
        getModificators: getModificators
    };

    var out = {
        instance: smokesignals.convert(app),
        internals: internals
    };

    if (DEBUG) {
        env.global.app = app;

        app.modulesByType = function(type) {
            return _.filter(internals.moduleDescriptors, function(descriptor) {
                return descriptor.type == type;
            });
        };

        app.findModule = function(type) {
            return app.modulesByType(type)[0];
        };

        out.appConfig = app;
    }

    return out;
};
