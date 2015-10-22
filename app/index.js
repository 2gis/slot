/**
 * Базовый модуль приложения. Работает как на клиенте, так и на сервере
 * @module app/Application
 */

var _ = require('lodash');
var async = require('async');
var UAParser = require('ua-parser-js');
var AsyncEmitter = require('async.emitter');
var inherits = require('inherits');

var injector = require('../lib/injector');
var env = require('../env');
var templateProvider = require('../lib/templateProvider');
var modulesQuering = require('../lib/modulesQuering');
var namer = require('../lib/namer');
var config = require('../config');
var templateHelpers = require('../lib/templateHelpers');
var Registry = require('../lib/registry');

module.exports = Application;
function Application() {
    AsyncEmitter.call(this);

    this._moduleDescriptors = {};
    this._ids = {};

    this.modules = {};
    this.components = {};
    /**
     * It's extremely important to realize that each app instance
     * should work with its own set of settings.
     * Otherwise, one instance may affect to another one.
     */
    this.config = _.cloneDeep(config);

    this.registry = new Registry();

    // @TODO: перенести в prototype
    this.queryModules = modulesQuering(this._moduleDescriptors);

    // setup plugins
    var plugins = config['plugins'] || [];
    _.each(plugins, function(name) {
        // Сначала ищем плагин у пользователя, затем внутри слота
        try {
            this[name] = this.require('plugins/' + name)(this);
        } catch (e) {
            this[name] = require('slot/plugins/' + name)(this);
        }
    }, this);

    var Handlebars = env.get('handlebars');

    // Create isolated Handlebars environment
    this.handlebars = Handlebars.create();
    templateHelpers(this);
}
inherits(Application, AsyncEmitter);

Application.prototype.isServer = env.isServer;
Application.prototype.isClient = env.isClient;

/**
 *
 * @param {string} parentId
 * @return {string|*}
 * @private
 */
Application.prototype._nextModuleId = function(parentId) {
    var key = parentId || 'root';
    if (!(key in this._ids)) {
        this._ids[key] = 1;
    }
    var nextId = this._ids[key]++;
    return _.compact([parentId, nextId]).join('-');
};

/**
 * Получить модификаторы.
 * Только на клиенте, т.к. используем dom элемент.
 *
 * @param {Object} instance
 * @returns {Object}
 */
Application.prototype.getModificators = function(instance) {
    var el = instance.block()[0];
    return el ? namer.parseMods(el.className) : {};
};

/**
 * @returns {boolean}
 */
Application.prototype.isBound = function() {
    return this._stage == 'bind';
};

Application.prototype.require = env.require;

/**
 * Определяет название стартового модуля для загрузки
 * для девелоперского окружения из url.
 *
 * @param {String} url
 * @return {String} Название модуля для загрузки
 */
Application.prototype.resolveDevPage = function(url) {
    var name;

    if (_.isString(url) && config.devPages) {
        var slug = _.compact(url.split('/'))[0];
        var devPageConfig = config.devPages[slug];

        if (devPageConfig) {
            name = devPageConfig.module;
            if (devPageConfig.history === false) {
                var stateTracker = this.requireComponent('stateTracker');
                stateTracker.disable();
            }
        }
    }

    return name;
};

/**
 * Возвращает рутовый модуль.
 * Названеи берется из конфига приложения, ключ 'mainModule' - строка.
 * Если строка начинается с '::', то считаем что это метод app
 *
 * @param req
 * @returns {Object} загруженный модуль
 */
Application.prototype.resolveEntryPoint = function(req) {
    req = req || {};

    var name = config.mainModule;

    if (!name) throw new Error("mainModule not configured");

    if (name.startsWith('::')) {
        name = name.substr(2);
        if (!this[name]) {
            throw new Error("App method " + name + " for mainModule not implemented");
        }
        name = this[name](req);
    }

    return name;
};

/**
 * Инициализация приложения: запись необходимых данных, инициализация модулей.
 *
 * @param {Object} req - параметры запроса
 * @param {Function} callback (err, mainModule) - коллбэк, вызываемый когда было проинициализировано приложение
 */
Application.prototype.init = function(req, callback) {
    callback = callback || _.noop;

    if (!req) throw new Error('[app.init]: param req must not be undefined');

    this._stage = 'init';
    var self = this;

    req.ua = typeof req.ua == 'string' ? UAParser(req.ua) : req.ua;

    this.registry.setup(req);
    // Куки, прилетевшие в инит приложения (используется на сервере)
    this.cookies = req.cookies;

    var beforeInitTasks = [];
    /**
     * Добавляет функции, которые должны выполниться до инициализации модулей
     *
     * @param {Function} fn (callback)
     */
    function addBeforeInitTask(fn) {
        if (_.isFunction(fn)) {
            if (fn.length == 0) {
                beforeInitTasks.push(function(callback) {
                    fn();
                    callback();
                });
            } else {
                beforeInitTasks.push(fn);
            }
        }
    }

    var mainModuleName = this.resolveDevPage(this.registry.get('url'));

    this.emit('initStart', {
        waitFor: addBeforeInitTask
    });

    async.parallel(beforeInitTasks, function(err) {
        if (err) callback(err);

        try {
            if (!mainModuleName) {
                mainModuleName = self.resolveEntryPoint(req);
            }
            var mainModule = self.mainModule = self.loadModule({type: mainModuleName});
            mainModule.init(req, function(err) {
                self.emit('initEnd', mainModule);
                callback(err, mainModule);
            });
        } catch (ex) {
            callback(ex);
        }
    });
};

/**
 * Выставляет модификаторы для данного модуля.
 *
 * @param {Object} moduleId - `id` модуля, для которого будут выставляться модификаторы.
 * @param {Object|string} modificators - Объект модификаторов, либо ключ в jQuery-like режиме.
 * @param {*} [value] - Значение выставляемого модификатора в jQuery-like режиме.
 * @returns {Object|string} Объект всех модификаторов, либо значение модификатора по ключу в jQuery-like режиме.
 */
Application.prototype.mod = function(moduleId, modificators, value) {
    var descriptor = this.getModuleDescriptorById(moduleId);

    if (_.isString(modificators)) { // jQuery-like -> true way
        var key = modificators;

        if (typeof value != 'undefined') { // setter
            modificators = {};
            modificators[key] = value;
        } else { // getter
            return descriptor.mods[key];
        }
    }

    if (_.isObject(modificators)) {
        var oldMods = _.clone(descriptor.mods),
            newMods = _.clone(modificators),
            block;

        _.extend(descriptor.mods, newMods);

        // Навешиваем классы
        if (this.isClient) { // или == 'bind' ?
            _.each(newMods, function(val, key) {
                var oldModVal = oldMods[key];

                if (oldModVal !== val) {
                    block = this.block(moduleId);

                    var oldModClass = namer.modificatorClass(key, oldModVal);

                    if (oldModClass) block.removeClass(oldModClass);

                    var newModClass = namer.modificatorClass(key, val);

                    if (newModClass) block.addClass(newModClass);
                }
            }, this);
        }

        // Запускаем хендлеры
        _.each(newMods, function(val, key) {
            var oldModVal = oldMods[key];

            if (oldModVal !== val) {
                var handlers = descriptor.moduleConf.modHandlers;
                if (handlers && handlers[key]) { // Вызов обработчиков установки или удаления модификатора
                    if (_.isFunction(handlers[key])) {
                        handlers[key].call(descriptor.moduleConf, val);
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
                        handlers._any.call(descriptor.moduleConf, key, val);
                    }
                }
            }
        }, this);
    }

    return descriptor.mods;
};

/**
 * Возвращает на сервере объект с методом `mod` для простановки модификаторов элементу.
 * Чтобы модификаторы выставились не забудьте воспользоваться хелпером mods.
 *
 * @param {string} moduleId
 * @param {string} elementName
 * @returns {{ mod: Function }}
 */
Application.prototype.element = function(moduleId, elementName) {
    var descriptor = this.getModuleDescriptorById(moduleId);

    return {
        mod: function(mods) {
            var elemMods = (descriptor.elementsMods[elementName] = descriptor.elementsMods[elementName] || {});
            if (mods != null) {
                _.extend(elemMods, mods);
            }
            return elemMods;
        }
    };
};

/**
 * Посылает сообщение модулям-родителям (антоним `broadcast`).
 *
 * @param {string} moduleId
 * @param {string} message
 * @returns {*}
 */
Application.prototype.notify = function(moduleId, message) {
    var args = [].slice.call(arguments, 2),
        notifier = this._moduleDescriptors[moduleId]; // Модуль, пославший нотифай

    if (!notifier) {
        throw new Error("app.notify: module with id " + moduleId + " doesn't exists, message: " + message);
    }

    var currentModuleId = notifier.parentId,
        needStop = false,
        retValue;
    var event = {
        sender: notifier,
        stop: function() {
            needStop = true;
        }
    };

    var currentDescriptor;
    while (currentModuleId) {
        currentDescriptor = this._moduleDescriptors[currentModuleId]; // Текущий модуль, у которого будем искать диспетчеры

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
};

/**
 * Загрузка компонента. Сначала пытается найти компонент в приложении, затем в слоте
 * @param  {String} name имя подключаемого компонента
 * @return {Object} module.exports подключаемого файла модуля
 */
Application.prototype.loadComponent = function(name) {
    var component;

    // Сначала пытаемся загрузить из приложения, если там нет - из слота
    try {
        component = this.require('components/' + name + '/' + name);
    } catch (e) {
        component = require('slot/components/' + name);
    }

    return component;
};

Application.prototype.newComponent = function(name, extraArgs) {
    extraArgs = extraArgs || [];
    var componentConstructor = this.loadComponent(name);

    return this.invoke(componentConstructor, [this].concat(extraArgs));
};

Application.prototype.requireComponent = function(name, extraArgs) {
    var componentConstructor = this.loadComponent(name);

    var identityKey = name;
    if (componentConstructor.identity) {
        identityKey = componentConstructor.identity.apply(componentConstructor, [name].concat(extraArgs));
    }
    if (!this.components[identityKey]) {
        this.components[identityKey] = this.newComponent(name, extraArgs);
    }
    return this.components[identityKey];
};

Application.prototype.processModules = function(moduleId, selector, handler, inclusive) {
    var moduleDescriptors = this.queryModules(moduleId, selector, inclusive);

    _.each(moduleDescriptors, function(moduleDescriptor) {
        handler(moduleDescriptor.instance, moduleDescriptor);
    });
};

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
 * остальные предикаты относятся к интерфейсным методам, т. е.:
 *
 * `frame[:active=true]` - берет только фреймы с модификатором active равным true
 * `searchResults[isActive]` - берет только те модули searchResults у которых интерфейсный метод isActive вернет `true`.
 *
 * К интерфейсным методам можно применять параметры
 *
 * `filters[hasContext=5]` - берет только те модули filters у которых интерфейсный метод hasContext(5) вернет `true`.
 *
 * Если модулей несколько, то возвращается значение последнего модуля. Если модулей нет - undefined.
 *
 * @returns {*}
 */
Application.prototype.broadcast = function(moduleId, message) {
    var args = [].slice.call(arguments, 2),
        lastIndexOfDelim = message.lastIndexOf(':'),
        selector = message.substr(0, lastIndexOfDelim),
        action = message.substr(lastIndexOfDelim + 1),
        retValue;

    this.processModules(moduleId, selector, function(moduleInstance) {
        if (moduleInstance.interface) {
            var handler = moduleInstance.interface[action];
            if (handler) {
                retValue = handler.apply(moduleInstance.interface, args);
            }
        }
    });

    return retValue;
};

Application.prototype.requireModuleJs = function(moduleName, fileName) {
    fileName = fileName || moduleName;

    var fn = 'modules/' + moduleName + '/' + fileName;

    return this.require(fn);
};

Application.prototype.invoke = function(fn, args, provider, self) {
    provider = provider || _.bind(this.requireComponent, this);
    return injector.invoke(fn, args, provider, self);
};

/**
 * Загружает js модуль, инстанцирует его и записывает в дерево иерархии модулей.
 *
 * @param {Object} data - Данные о том, какого типа и куда в дереве модулей должен быть записан новый модуль.
 * @returns {slot.Slot} Инстанс нового модуля.
 */
Application.prototype.loadModule = function(data) {
    var app = this;

    var parentId = data.parentId,
        moduleId = data.id || this._nextModuleId(parentId),
        moduleName = data.type;

    var Slot = require('../slot'),
        moduleJs = this.requireModuleJs(moduleName);

    var slot = new Slot(app, {
        moduleId: moduleId,
        moduleName: moduleName,
        templates: templateProvider.forModule(moduleName, this.handlebars)
    });

    if (!_.isFunction(moduleJs)) { // если возвращает не функцию — ругаемся
        throw new Error('Bad moduleJs: ' + moduleName);
    }

    var moduleConf = this.invoke(moduleJs, [slot], _.bind(slot.requireComponent, slot));
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

    this._moduleDescriptors[moduleId] = moduleDescriptor;

    if (parentId) {
        this._moduleDescriptors[parentId].children.push(moduleId);
    }

    var moduleConstructor = require('../moduleConstructor'),
        moduleInstance = moduleConstructor(this, moduleConf, slot);

    moduleDescriptor.instance = moduleInstance;

    // На клиенте собираем модификаторы, расставленные при рендеринге на сервере.
    if (this.isClient) {
        slot.mod(this.getModificators(moduleInstance));
    }

    // Кастомный блок для модуля
    if (moduleConf.block) {
        slot.mod({module: moduleInstance.type});
    }

    this.emit('moduleLoaded', moduleDescriptor);

    return moduleInstance;
};

/**
 * Модуль убивается (анбиндинг, удаление асинхронных функций), но сохраняется в дом-дереве и дереве модулей
 * @param moduleId
 */
Application.prototype.killModule = function(moduleId) {
    var descriptor = this._moduleDescriptors[moduleId];
    if (!descriptor) return;

    var slot = descriptor.slot,
        moduleInstance = descriptor.instance;

    if (slot.stage == slot.STAGE_KILLED) return;
    slot.stage = slot.STAGE_KILLED;

    slot.clearTimers();
    slot.clearRequests();
    if (this.isBound()) {
        this.unbindEvents(moduleId);
    }

    // Убиваем ссылку на модуль из родительского slot.modules
    var parentId = descriptor.parentId;
    if (parentId) {
        var parent = this._moduleDescriptors[parentId];
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
    _.each(descriptor.children, function(childId) {
        this.killModule(childId);
    }, this);
};

/**
 * Модуль окончательно удаляется (из дом-дерева и дерева модулей)
 * @param moduleId
 */
Application.prototype.removeModule = function(moduleId) {
    var descriptor = this._moduleDescriptors[moduleId];
    if (!descriptor) return;

    var moduleConf = descriptor.moduleConf,
        slot = descriptor.slot,
        parentId = descriptor.parentId;

    if (moduleConf.dispose) moduleConf.dispose();

    if (this.isClient) {
        slot.block().remove();
    }
    slot.stage = slot.STAGE_DISPOSED;

    _.each(descriptor.children, function(childId) {
        this.removeModule(childId);
    }, this);

    this.emit('moduleDisposed', descriptor);

    if (parentId) {
        this._moduleDescriptors[parentId].children = _.without(this._moduleDescriptors[parentId].children, moduleId);
        delete this._moduleDescriptors[parentId].slot.modules[descriptor.type];
    }
    delete this._moduleDescriptors[moduleId];
};

Application.prototype.disposeModule = function(moduleId) {
    this.killModule(moduleId);
    this.removeModule(moduleId);
};

/**
 * Возвращает дескриптор модуля по его id.
 *
 * @param {string} moduleId - `id` модуля, который будет искаться в moduleDescriptors.
 * @returns {Object} Дескриптор найденного объекта.
 */
Application.prototype.getModuleDescriptorById = function(moduleId) {
    var descriptor = this._moduleDescriptors[moduleId];

    if (!descriptor) {
        throw new Error('[slot getModuleDescriptorById] No module with moduleId ' + moduleId + ' found.');
    }

    return descriptor;
};

// @TODO: rename to getChildModuleInstanceById ?
Application.prototype.getChildModuleWrapperById = function(moduleId, childModuleId) {
    var moduleDescriptor = this.getModuleDescriptorById(childModuleId);
    if (moduleDescriptor.parentId == moduleId) {
        return moduleDescriptor.instance;
    }
};

/**
 * @param {Function} func
 * @param {int} delay
 */
Application.prototype.setTimeout = function(func, delay) {
    if (this.isServer) {
        func();
    } else {
        return setTimeout(func, delay);
    }
};

/**
 * @param {Function} func
 * @param {int} delay
 */
Application.prototype.setInterval = function(func, delay) {
    return setInterval(func, delay);
};


/**
 * Вызывается при запуске транзишенов.
 * Для переопределения в конечных продуктах.
 *
 * @param {Array} transitions
 */
Application.prototype.transitionSort = function(transitions) {
    //
};

/**
 * Кинуть некоторое исключение которое должно обработаться управляющим кодом аппликейшена.
 *
 * Например raise(404) на сервере показывает глобальную 404 страницу, т.е. данная функция некоторый
 * аналог конструкции throw, но она не подходит в силу обрыва контекста исполнения при вызове асинхронных
 * функций в javascript'e.
 * А как работает? Тупо смотрится значение raised в `server.js`.
 * @param value - Объект исключения.
 */
Application.prototype.raise = function(value) {
    this.raised = value;
};

/**
 * Чтение или запись кук. Работает как на сервере, так и на клиенте.
 * Интерфейс как у jQuery.
 * Подразумевается, что на клиенте есть jQuery.
 */
Application.prototype.cookie = function(key, value, params) {
    params = params || {};

    _.defaults(params, {
        path: '/',
        expires: 365
    });

    if (this.isClient) {
        return $.cookie(key, value, params);
    } else {
        if (typeof value != 'undefined') {
            if (params.expires) {
                // jquery days to express ms
                params.expires = new Date(Date.now() + params.expires * 24 * 60 * 60 * 1000);
            }

            this.cookies[key] = value;
            this.emit('cookie', key, value, params);
        } else {
            value = this.cookies[key]; // Извлечь значение куки key на сервере из запроса клиента
        }

        return value;
    }
};

Application.prototype.removeCookie = function(key, params) {
    if (this.isClient) {
        return $.removeCookie(key, params);
    } else {
        delete this.cookies[key];
        this.emit('removeCookie', key, params);
    }
};

if (DEBUG) {
    Application.prototype.modulesByType = function(type) {
        return _.filter(this._moduleDescriptors, function(descriptor) {
            return descriptor.type == type;
        });
    };

    Application.prototype.findModule = function(type) {
        return this.modulesByType(type)[0];
    };
}
