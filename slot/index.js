/**
 * @module Slot
 * @type {Slot}
 */

var async = require('async');
var _ = require('lodash');
var env = require('./../env');
var templateHelpers = require('./templateHelpers');

var STAGE_INITING = Slot.prototype.STAGE_INITING = 1;
var STAGE_INITED = Slot.prototype.STAGE_INITED = 2;
var STAGE_KILLED = Slot.prototype.STAGE_KILLED = 4;
var STAGE_DISPOSED = Slot.prototype.STAGE_DISPOSED = 8;
var STAGE_ALIVE = Slot.prototype.STAGE_ALIVE = 3; // = STAGE_INITING | STAGE_INITED
var STAGE_NOT_ALIVE = Slot.prototype.STAGE_NOT_ALIVE = 12; // = STAGE_DISPOSED | STAGE_KILLED

module.exports = Slot;
function Slot(app, params) {
    this.app = app;
    this._moduleId = params.moduleId;
    this._moduleName = params.moduleName;
    this.templates = params.templates;

    this.timers = []; // Массив всех таймеров для текущей копии модуля
    this.requests = []; // Массив запросов к апи

    this.modules = {};
    this.config = app.config;
    this.registry = app.registry;

    this.stage = this.STAGE_INITING;

    this.initTemplates();
    this.initPlugins();

    app.emit('slotInit', this);
}

Slot.prototype.initTemplates = function() {
    this._templatePartials = _.omit(this.templates, this._moduleName);
    this._templateHelpers = templateHelpers(this, this.app.handlebars);
};

Slot.prototype.extendTmplHelpers = function(helpersToAdd) {
    _.extend(this._templateHelpers, helpersToAdd);
    this._tmplOptions = null; // invalidate templateOptions
};

/**
 * Перерисовывает шаблон модуля templates/tmplName.html с данными viewContext, и возвращает полученный html.
 * Заменить в DOM-дереве html нужно вручную. Рекомендуется использовать вместо rerender везде, где это возможно.
 *
 * @method renderPartial
 * @memberof module:Slot
 * @param {string} partialName Имя файла шаблона, на основе которого будет получен html
 * @param {object} viewContext Контекст с данными, которыми будет заполнен шаблон для получения html
 * @returns {HTML}
 */
Slot.prototype.renderPartial = function(partialName, viewContext) {
    var tmpl = this.templates[partialName];

    if (!tmpl) {
        throw new Error('slot.renderPartial: partial "' + partialName + '" not found');
    }

    return tmpl(viewContext, this.templateOptions());
};

Slot.prototype.hasPartial = function(name) {
    return name in this._templatePartials;
};

Slot.prototype.templateOptions = function() {
    if (!this._tmplOptions) {
        var descriptor = this.app.getModuleDescriptorById(this._moduleId),
            moduleConf = descriptor.moduleConf;

        var options = {},
            partials = moduleConf.partials || {},
            helpers = moduleConf.helpers || {};

        options.partials = _.defaults(partials, this._templatePartials);
        options.helpers = _.defaults(helpers, this._templateHelpers);

        return options;
    }
    return this._tmplOptions;
};

Slot.prototype.initPlugins = function() {
    _.each(this.app.config['plugins'], function(name) {
        this[name] = this.app[name];
    }, this);
};

Slot.prototype.loadModule = function(conf) {
    // новый объект необязательно создавать
    // сейчас нет и скорее всего не будет ситуации когда один и тот же конфиг передается на инициализацию разным
    // слотам даже в этом случае использование parentId далее происходит через копирование и опасности никакой нет
    conf.parentId = this._moduleId;
    return this.app.loadModule(conf);
};

/**
 * Инициализирует 1 дочерний модуль.
 * После инициализации модуль доступен в шаблонах через хелпер module, если инициализация дочернего модуля происходит на этапе инициализации текущего.
 *
 * @method init
 * @memberof module:Slot
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
 * @param {string} name - Тип модуля, например firmCard.
 * @param {object} [data] - Данные для инициализации модуля, которые прилетят в инит модуля первым аргументом.
 * @param {function} [callback] - Колбек, вызываемый инитом модуля асинхронно, или враппером синхронно,
 *                                если модуль синхронный и не имеет колбека в ините.
 * @returns {object|undefined} Инстанс инициализированного (или инициализируемого) модуля
 */
Slot.prototype.init = function(name, data, callback) {
    var slot = this;

    // Если слот умер - ничего инитить нет смысла, потому что слот умирает вместе с родительским модулем
    if (slot.stage & STAGE_NOT_ALIVE) {
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

    var module = slot.loadModule({type: name, data: data});


    module.init(data, function(err) {
        var moduleName = name;

        if (err) {
            module.dispose();
        } else {
            if (module.slot.stage & STAGE_INITED) { // На случай, если суицид модуля
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
};

/**
 * Параллельная инициализация массива дочерних модулей.
 * @example
 * // Init module with some init data and callback
 * slot.initModules([{
 *    type: 'zoom',
 *    data: {}
 * }, {
 *    type: 'control',
 *    data: {}
 * }, function(initedModules) {
 *    // pass
 * }];
 *
 * @method initModules
 * @memberof module:Slot
 *
 * @param {array} modules - Массив описаний инициализируемых модулей.
 * @param {function} [callback] - Колбек, вызываемый после инициализации всех модулей, либо сразу после любой ошибки в любом из модулей.
 */
Slot.prototype.initModules = function(modules, callback) {
    async.map(modules, _.bind(this.init, this), callback || _.noop);
};

/**
 * Последовательная инициализация массива дочерних модулей.
 * @method initModulesSeries
 * @memberof module:Slot
 * @example
 * // Init module with some init data and callback
 * slot.initModules([{
 *    type: 'zoom',
 *    data: {}
 * }, {
 *    type: 'control',
 *    data: {}
 * }, function(initedModules) {
 *    // pass
 * }];
 *
 * @param {array} modules - Массив описаний инициализируемых модулей.
 * @param {function} [callback] - Колбек, вызываемый после инициализации всех модулей, либо сразу после любой ошибки в любом из модулей.
 */
Slot.prototype.initModulesSeries = function(modules, callback) {
    async.mapSeries(modules, _.bind(this.init, this), callback);
};

/**
 * Получение ссылки на компонент. Сам компонент инициализируется вместе с приложением и является синглтоном.
 * @method requireComponent
 * @memberof module:Slot
 *
 * @param {string} name Имя компонента.
 * @param {array} [extraArgs] Дополнительные аргументы
 * @returns {object} Возвращает ссылку на компонент componentName.
 */
Slot.prototype.requireComponent = function(name, extraArgs) {
    var slot = this,
        app = slot.app;

    var component,
        componentMeta = app.loadComponent(name);

    if (componentMeta.emitAbortablesBy) {
        component = app.newComponent(name, extraArgs);
        component.on(componentMeta.emitAbortablesBy, function(req) {
            slot.requests.push(req);
        });
        component.on('done', function(req) {
            slot.requests = _.without(slot.requests, req);
        });
    } else {
        component = app.requireComponent(name, extraArgs);
    }
    return component;
};

Slot.prototype.clearRequests = function() {
    _.each(this.requests, function(req) {
        req.abort();
    });
    this.requests = [];
};

/**
 * Вызывает func, с аргументами, состоящими из двух частей:
 *  - "простые" аргументы передаются как есть из массива, переданного в invoke вторым аргументом;
 *  - "dependency injection" аргументы, начинающиеся в целевой функции func с символа $, заполняются компонентами приложения.
 * @example
 * // Пусть есть функция
 * function nearestStations(model, $api, $request, options) {};
 * // В ней второй и третий аргументы начинаются с символа $, это значит, что туда должны быть переданы ссылки на соответствующие компоненты приложения.
 * // Чтобы не делать этого вручную, можно воспользоваться:
 * slot.invoke(nearestStations, [model, options]);
 * // "Простые" аргументы будут переданы в первый и четвёртый аргументы функции соответственно, а во второй и третий аргументы будут автоматически переданы компоненты api и request.
 *
 * @method invoke
 * @memberof module:Slot
 * @param {function} func Функция, в аргументах которых есть переменные, начинающиеся с $, в которые надо передать ссылки на компоненты.
 * @param {array} arguments Массив аргументов, передаваемых как есть в те аргументы функции, имена которых не начинаются с $.
 * @returns {function} Результат вызова функции func с подставленными аргументами и компонентами.
 */
Slot.prototype.invoke = proxy('invoke');

/**
 * Отправка сообщения eventName вверх по цепочке родительских модулей. Аргументы со второго и далее аргументы передаются в обработчик сообщения как есть.
 * @example
 * // Отправить сообщение предкам о том, что пользователь кликнул в кнопку закрытия
 * slot.notify('closeButtonClicked');
 *
 * @example
 * // Отправить сообщение предкам о выборе новости номер 168 с дополнительными данными
 * slot.notify('newsPicked', 168, options, someData);
 *
 * @method notify
 * @memberof module:Slot
 * @param {String} message Название сообщения
 * @param {*} [body] Тело сообщения
 * @returns {*} Первое не-undefined возвращаемое значение в иерархической цепочке обработчиков (обычно это ближайший предок)
 */
Slot.prototype.notify = proxy('notify', true);

/**
 * Отправка сообщения вниз некоторой выборке модулей-потомков.
 * @example
 * // Вызов метода close у всех модулей-потомков типа card
 * slot.broadcast('card:close');
 * @example
 * // Вызов метода close у всех модулей-потомков
 * slot.broadcast('*:close');
 * @example
 * // ... всех модулей типа card, являющиеся потомками модулей типа frame
 * slot.broadcast('frame card:methodName');
 * @example
 * // ... всех модулей типа card, являющиеся потомками модулей типа frame, и являющиеся последними потомками этого типа внутри своих непосредственных родителей.
 * // Например, если есть два модуля типа frame, и в каждом из них по три модуля типа card, то выборка вернёт третий и шестой модули card. Аналогично работает :first-child.
 * slot.broadcast('frame card[:last-child]:methodName');
 * @example
 * // ... сделает выборку по селектору "frame card" и вернёт только последний модуль из этой выборки. Аналогично работает :first.
 * slot.broadcast('frame card[:last]:methodName');
 * @example
 * // ... всех модулей типа search у которых модификатор active имеет эначение строго равное true.
 * slot.broadcast('search[active]');
 * @example
 * // ... всех модулей типа search у которых модификатор num выставлен в значение равное 3.
 * slot.broadcast('search[num=3]');
 * @example
 * // ... всех модулей типа callout интерфейсный метод someLogic которых, вызванный с аргументом "qwe", вернёт значение, нестрого равное true.
 * slot.broadcast('search[::someLogic(qwe)]');
 * @example
 * // ... всех модулей типа callout интерфейсный метод someLogic которых, вызванный с аргументом "qwe", вернёт значение, равное 'asd'.
 * slot.broadcast('search[::someLogic(qwe)=asd]');
 * @example
 * // ... все модули типа firmCard модификатор type которых выставлен в любое, отличное от дефолтного значения,
 * // интерфейсный метод getPosition которых от аргумента 3 возвращает значение 1, которые являются потомками модулей выборки "dataViewer frame:last".
 * slot.broadcast('dataViewer frame:last firmCard[type=*][::getPosition(3)=1]');
 *
 * @method broadcast
 * @memberof module:Slot
 * @param {String} selector правило, на основе которого будет произведена выборка модулей-потомков;
 *      interfaceMethod - метод, который будет вызван у каждого модуля-потомка из выборки. Выборка всегда делается относительно текущего модуля,
 *      строго вниз по иерархии, будто модулей-предков текущего модуля, и других модулей-потомков этих предков, не существует.
 * @param {*} [body] Тело сообщения
 * @returns {*} Первое не-undefined возвращаемое значение в иерархической цепочке обработчиков (обычно это ближайший предок)
 */
Slot.prototype.broadcast = proxy('broadcast', true);
Slot.prototype.queryModules = proxy('queryModules', true);

/**
 * Рекурсивно для текущего модуля и всех его потомков удаляет все обработчики событий, все асинхронные вызовы slot.setTimeout и slot.setInterval,
 * отменяет все колбеки обёрнутые в slot.ifAlive; удаляет модуль из дерева модулей (события до него больше не доходят и в slot.modules родителя его больше нет).
 * Метод бывает полезен, когда удаление модуля происходит анимировано: модуль отключается от фреймворка, но визуально ещё доступен.
 *
 * @method kill
 * @memberof module:Slot
 */
Slot.prototype.kill = proxy('killModule', true);
Slot.prototype.remove = proxy('removeModule', true);

/**
 * Рекурсивно для текущего модуля и всех его потомков вызывает kill; удаляет html-представление из DOM-дерева.
 *
 * @method dispose
 * @memberof module:Slot
 */
Slot.prototype.dispose = proxy('disposeModule', true);

Slot.prototype.domBound = proxy('isBound');

/**
 * Возвращает jQuery-объект по селектору "#id .element-selector", где id - идентификатор корневого DOM-элемента текущего модуля.
 * @example
 * // Получить положение элемента card &lt;div class="card__closeButton"&gt; текущего модуля
 * slot.element('closeButton').offset().top;
 *
 * @method element
 * @memberof module:Slot
 * @param {string} elementName Название элемента, описанного в разделе elements текущего модуля
 * @returns {jQuery} Коллекция всех найденных внутри модуля DOM-элементов, соответствующих селектору элемента
 */
Slot.prototype.element = proxy('element', true);

/**
 * Устанавливает модификаторы модуля по парам ключ-значение переданного объекта.
 * @example
 * // Выставить модификатор active в true, и модификатор num в 4
 * slot.mod({active: true, num: 4});
 * @example
 * // Выставить модификатор state в 'active'
 * slot.mod('state', 'active');
 * @example
 * // Получить значения модификаторов (значения не меняются)
 * var mods = slot.mod();
 *
 * @method mod
 * @memberof module:Slot
 * @param {object|string} [mods|modName] Объект с новыми значениями модификаторов, либо название модификатора
 * @param {*} [modValue] Значение модификатора modName
 * @returns {object} mods Имена и значения всех выставленных модификаторов в формате ключ-значение
 */
Slot.prototype.mod = proxy('mod', true);

/**
 * Кинуть некоторое исключение которое должно обработаться управляющим кодом приложения.
 * Аналог конструкции throw, но она не подходит в силу обрыва контекста исполнения при вызове асинхронных функций в javascript'e.
 * @example
 * if (!result) slot.raise(404);
 *
 * @method raise
 * @memberof module:Slot
 * @param {*} value - Объект исключения.
 */
Slot.prototype.raise = proxy('raise');

/**
 * Читает или выставляет, и удаляет куки соответственно. Работает аналогично $.fn.cookie. Отличие заключается в том, что метод изоморфен, то есть работает и на сервере.
 * @example
 * // Получить значение куки
 * var name = slot.cookie('userName');
 * @example
 * // Записать значение куки
 * slot.cookie('userName', 'Dima', {
 *    expires: 365,
 *    path: '/'
 * });
 *
 * @method cookie
 * @memberof module:Slot
 * @param {string} name Имя куки
 * @param {string} [value] Значение куки. Без значения работает как геттер.
 * @param {object} [options] Параметры выставления куки.
 * @returns {string} value Значение куки name
 */
Slot.prototype.cookie = proxy('cookie');

/**
 * Возвращает дочерний модуль по id.
 * @method moduleById
 * @memberof module:Slot
 * @param {string} id Идентификатор дочернего модуля.
 * @returns {object} module Инстанс дочернего модуля с идентификатором равным id.
 */
Slot.prototype.moduleById = proxy('getChildModuleWrapperById', true);

/**
 * Флаг, отвечающий на вопрос: происходит ли исполнение кода на сервере?
 * @constant isServer
 * @memberof module:Slot
 */
Slot.prototype.isServer = env.isServer;

/**
 * Флаг, отвечающий на вопрос: происходит ли исполнение кода на клиенте в браузере?
 * @constant isClient
 * @memberof module:Slot
 */
Slot.prototype.isClient = env.isClient;

Slot.prototype.rebind = function() {
    if (this.isClient) {
        this.unbindEvents();
        this.bindEvents();
    }
};

/**
 * Возвращает id текущего модуля, вызывается без аргументов. Используйте {@link Slot#self} для получения ссылки на инстанс модуля.
 * @method moduleId
 * @memberof module:Slot
 * @returns {string} id текущего модуля
 */
Slot.prototype.moduleId = function() {
    return this._moduleId;
};

/**
 * Устанавливает таймаут привязанный к модулю. Автоматически удаляется в момент смерти модуля.
 *
 * @method setTimeout
 * @memberof module:Slot
 * @param {function} func Функция для отложенного вызова
 * @param {int} delay Задержка выполнения функции в мс
 * @returns {int|undefined} id таймера или undefined если вызывается в состоянии STAGE_NOT_ALIVE
 */
Slot.prototype.setTimeout = function(func, delay) {
    if (this.stage & STAGE_NOT_ALIVE) {
        return;
    }

    var timer = this.app.setTimeout(func, delay);
    this.timers.push(timer);

    return timer;
};

/**
 * Устанавливает интервал привязанный к модулю. Автоматически удаляется в момент смерти модуля.
 *
 * @method setInterval
 * @memberof module:Slot
 * @param {function} func Функция для отложенного вызова
 * @param {int} delay Интервал выполнения функции в мс
 * @returns {int} id таймера
 */
Slot.prototype.setInterval = function(func, delay) {
    var timer = this.app.setInterval(func, delay);
    this.timers.push(timer);

    return timer;
};

/**
 * Отменяет ранее установленные для данного модуля таймауты slot.setTimeout и slot.setInterval.
 *
 * @method clearTimers
 */
Slot.prototype.clearTimers = function() {
    _.each(this.timers, clearTimeout);
};

/**
 * Возвращает ссылку на инстанс текущего модуля.
 *
 * @method self
 * @memberof module:Slot
 * @returns {object} instance ссылка на инстанс текущего модуля
 */
Slot.prototype.self = function() {
    var descriptor = this.app.getModuleDescriptorById(this._moduleId);
    return descriptor && descriptor.instance;
};

/**
 * Возвращает обёртку функции callback. Вызов обёртки приводит к вызову переданной функции, с сохранением аргументов и контекста, если модуль жив,
 * и не приводит ни к чему, если модуль мёртв. Удобно для оборачивания колбеков ajax-запросов и defferred.
 *
 * @method ifAlive
 * @memberof module:Slot
 * @param {Function} fn Функция, которую нужно выполнить при вызове обёртки если модуль жив
 * @returns {Function} Функция-обёртка переданной функции
 */
Slot.prototype.ifAlive = function(fn) {
    var slot = this;

    return function() {
        if (slot.stage & STAGE_ALIVE) {
            fn.apply(this, arguments);
        }
    };
};

if (env.isClient) {
    Slot.prototype.addTransition = proxy('addTransition');
    Slot.prototype.onTransitionEnd = proxy('onTransitionEnd');
    Slot.prototype.runInQueue = proxy('runInQueue');

    /**
     * Метод, возвращающий jQuery-объект с корневым DOM-элементом текущего модуля.
     * @example
     * // Получить высоту модуля
     * var height = slot.block().heigh;
     *
     * @method block
     * @memberof module:Slot
     * @returns {jQuery} Коллекция с одним DOM-элементом - блоком текущего модуля
     */
    Slot.prototype.block = proxy('block', true);

    /**
     * Перерисовывает модуль в браузере:
     *  - удаляет все события со всех элементов;
     *  - получает новый html;
     *  - заменяет старый html на новый;
     *  - заново добавляет все обработчики событий; вызывает метод bind модуля.
     *
     * @method rerender
     * @memberof module:Slot
     */
    Slot.prototype.rerender = proxy('rerender', true);
    Slot.prototype.bindEvents = proxy('bindEvents', true);
    Slot.prototype.unbindEvents = proxy('unbindEvents', true);
}

/**
 * Проксирует вызов метода из инстанса app
 *
 * @private
 * @param {string} method
 * @param {boolean} [passId]
 * @returns {Function}
 */
function proxy(method, passId) {
    return function() {
        var args = !!passId ? [this._moduleId].concat(_.toArray(arguments)) : arguments;
        return this.app[method].apply(this.app, args);
    };
}
