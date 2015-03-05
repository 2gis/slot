
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

Slot.prototype.renderPartial = function(template, ctx) {
    var tmpl = this.templates[template];

    if (!tmpl) {
        throw new Error('slot.renderPartial: partial "' + template + '" not found');
    }

    return tmpl(ctx, this.templateOptions());
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
    if (Slot.pluginsInited) return;

    // @TODO: переделать плагин onNextFrame
    _.each(this.app.config['plugins'], function(name) {
        Slot.prototype[name] = this.app[name];
    }, this);

    Slot.pluginsInited = true;
};

Slot.prototype.loadModule = function(conf) {
    // новый объект необязательно создавать
    // сейчас нет и скорее всего не будет ситуации когда один и тот же конфиг передается на инициализацию разным
    // слотам даже в этом случае использование parentId далее происходит через копирование и опасности никакой нет
    conf.parentId = this._moduleId;
    return this.app.loadModule(conf);
};

function proxy(method, passId) {
    return function() {
        var args = passId ? [this._moduleId].concat(_.toArray(arguments)) : arguments;
        return this.app[method].apply(this.app, args);
    };
}

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
 * @param {object} [data] - Данные для инициализации модуля, которые прилетят в инит модуля первым аргументом.
 * @param {function} [callback] - Колбек, вызываемый инитом модуля асинхронно, или враппером синхронно,
 *                                если модуль синхронный и не имеет колбека в ините.
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
 * Палаллельная нициализация массива модулей.
 *
 * @param {Array} modules - Массив описаний инициализируемых модулей.
 * @param {Function} callback - Опциональный колбек, вызываемый после инициализации всех модулей.
 */
Slot.prototype.initModules = function(modules, callback) {
    async.map(modules, _.bind(this.init, this), callback || _.noop);
};

Slot.prototype.initModulesSeries = function(modules, callback) {
    async.mapSeries(modules, _.bind(this.init, this), callback);
};

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

if (env.isClient) {
    Slot.prototype.addTransition = proxy('addTransition');
    Slot.prototype.onTransitionEnd = proxy('onTransitionEnd');
    Slot.prototype.runInQueue = proxy('runInQueue');
    Slot.prototype.block = proxy('block', true);
    Slot.prototype.rerender = proxy('rerender', true);
    Slot.prototype.bindEvents = proxy('bindEvents', true);
    Slot.prototype.unbindEvents = proxy('unbindEvents', true);
}

Slot.prototype.invoke = proxy('invoke');
Slot.prototype.notify = proxy('notify', true);
Slot.prototype.broadcast = proxy('broadcast', true);
Slot.prototype.queryModules = proxy('queryModules', true);

Slot.prototype.kill = proxy('killModule', true);
Slot.prototype.remove = proxy('removeModule', true);
Slot.prototype.dispose = proxy('disposeModule', true);

Slot.prototype.domBound = proxy('isBound');

Slot.prototype.element = proxy('element', true);
Slot.prototype.mod = proxy('mod', true);

Slot.prototype.raise = proxy('raise');
Slot.prototype.cookie = proxy('cookie');

/**
 * Возвращает дочерний модуль по айдишнику.
 */
Slot.prototype.moduleById = proxy('getChildModuleWrapperById', true);

Slot.prototype.isServer = env.isServer;
Slot.prototype.isClient = env.isClient;

Slot.prototype.rebind = function() {
    if (this.isClient) {
        this.unbindEvents();
        this.bindEvents();
    }
};

/**
 * @returns {string} Айдишник модуля.
 */
Slot.prototype.moduleId = function() {
    return this._moduleId;
};

/**
 * Устанавливает таймаут привязанный к модулю.
 *
 * @param {Function} func
 * @param {int} delay
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
 * Отменяет ранее установленные для данного модуля таймауты.
 */
Slot.prototype.clearTimers = function() {
    _.each(this.timers, clearTimeout);
};

/**
 * Устанавливает интервал привязанный к модулю.
 *
 * @param {Function} func
 * @param {int} delay
 */
Slot.prototype.setInterval = function(func, delay) {
    var timer = this.app.setInterval(func, delay);
    this.timers.push(timer);

    return timer;
};

Slot.prototype.self = function() {
    var descriptor = this.app.getModuleDescriptorById(this._moduleId);
    return descriptor && descriptor.instance;
};

/**
 * Регистритует функцию и возвращает триггер на её исполнение, не исполняет если модуль уже убит.
 *
 * @param {Function} fn
 * @returns {Function}
 */
Slot.prototype.ifAlive = function(fn) {
    var slot = this;

    return function() {
        if (slot.stage & STAGE_ALIVE) {
            fn.apply(this, arguments);
        }
    };
};

module.exports = Slot;
