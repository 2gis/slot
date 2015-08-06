/**
 * Расширенная версия Application до методов специфичных клиентскому окружению
 *
 * @module app/ClientApplication
 */

var _ = require('lodash');
var Application = require('./index');
var namer = require('../lib/namer');
var defer = require('../lib/defer');
var inherits = require('inherits');
require('./jquery.mod');

module.exports = ClientApplication;
function ClientApplication() {
    Application.call(this);

    this.transitions = [];
    this.transitionsEnded = defer();
    this._transitionsAreRunning = false;

    // @TODO: перенести в онлайн
    this.queue = [];
    this._queueAreRunning = false;
}
inherits(ClientApplication, Application);

ClientApplication.prototype.bind = function() {
    this._stage = 'bind';

    this.emit('bind');

    // Навешиваем события на все модули
    this.bindEvents(this.mainModule.id);
};

// @TODO: перенести в онлайн
ClientApplication.prototype.runInQueue = function(handler) {
    var app = this;

    app.queue.push(handler);
    if (app._queueAreRunning) return;
    queueStep();

    function queueStep() {
        var transition = app.queue.shift();
        if (transition !== undefined) {
            transition(queueStep);
        } else {
            app._queueAreRunning = false;
        }
    }
};

/**
 * Если транзишены не запущены, то при добавлении нового запускаем. Если запущены, просто добавляем в очередь.
 *
 * @param {Function} handler
 * @param {string} purpose - К какому модулю/сущности относится транзишен.
 */
ClientApplication.prototype.addTransition = function(handler, purpose) {
    handler.purpose = purpose;
    this.transitions.push(handler);
};

ClientApplication.prototype.runTransitions = function(callback) {
    var app = this;

    if (this._transitionsAreRunning) return;
    this._transitionsAreRunning = true;

    this.transitionSort(this.transitions);
    transitionStep();

    function transitionStep() {
        var transition = app.transitions.shift();
        if (transition !== undefined) {
            transition(transitionStep);
        } else {
            app._transitionsAreRunning = false;
            app.transitionsEnded.resolve();
            app.transitionsEnded = defer();
            if (callback) callback();
        }

    }
};

/**
 * Когда стейт изменился - вызвалось поведение (transition), в конце которого вызывается наша функция.
 *
 * @param {Function} listener
 */
ClientApplication.prototype.onTransitionEnd = function(listener) {
    this.transitionsEnded.then(listener);
};

ClientApplication.prototype.block = function(moduleId) {
    var containerId = moduleBlockId(moduleId);

    return $(containerId);
};

/**
 * Перерисовать модуль.
 *
 * @param {string} moduleId
 */
ClientApplication.prototype.rerender = function(moduleId) {
    var descriptor = this.getModuleDescriptorById(moduleId),
        html = descriptor.instance.render();

    this.unbindEvents(moduleId);

    $(moduleBlockId(moduleId)).replaceWith(html);

    this.bindEvents(moduleId);
};

/**
 * Возвращает jQuery-объект по заданному элементу для текущего модуля.
 * Ищет либо по БЭМ, либо по полю selector, но всегда внутри модуля
 *
 * @param {string} moduleId - id текущего модуля, внутри которого будет искаться элемент
 * @param {string} elementName - имя искомого элемента
 */
ClientApplication.prototype.element = function(moduleId, elementName) {
    var descriptor = this.getModuleDescriptorById(moduleId),
        elementDeclaration = descriptor.moduleConf.elements && descriptor.moduleConf.elements[elementName],
        blockName = descriptor.moduleConf.block || descriptor.type;

    // Кастомный селектор для элемента, относительно корневого элемента модуля
    var selector = elementDeclaration && elementDeclaration.selector || '.' + namer.elementClass(blockName, elementName);

    return $(selector, moduleBlockId(moduleId)); // Возвращаемые элементы (jQuery объект)
};

/**
 * Навешивает события на элементы модуля (или на один элемент, если передан elementName) и все дочерние модули.
 *
 * @param {string} moduleId
 * @param {string} elementName
 * @param {boolean} on
 */
ClientApplication.prototype.processEvents = function(moduleId, elementName, on) {
    // во время инициализации события не навешиваем и не отвешиваем вообще, в принципе.
    if (this._stage == 'init') return;

    var descriptor = this.getModuleDescriptorById(moduleId),
        elements = descriptor.moduleConf.elements;

    // Если у модуля уже навешены события, не навешиваем их еще раз
    if (on && descriptor.instance.isEventsBound) {
        return;
    }
    descriptor.instance.isEventsBound = on;

    if (elementName) {
        elements = _.pick(descriptor.moduleConf.elements, elementName);
    }

    // Пробегаемся по ассоциативному массиву элементов, заданном в модуле
    _.each(elements, function(eventsConfig, elementName) {
        var selector = eventsConfig.selector ||
            '.' + namer.elementClass(descriptor.moduleConf.block || descriptor.type, elementName);
        var container = this.block(moduleId);

        // Выбираем все значения из объекта, за исключением селектора
        var handlers = _.omit(eventsConfig, 'selector');

        _.each(handlers, function(handler, eventName) {
            if (_.isFunction(this.customBindElementEvents)) {
                this.customBindElementEvents(selector, elementName, container, eventName, handler, on);
            } else {
                this._bindElementEvents(selector, elementName, container, eventName, handler, on);
            }
        }, this);
    }, this);

    if (on) {
        descriptor.instance.clientInit();
        descriptor.instance.bind();
    }

    // Рекурсивно вызываем функцию для всех дочерних элементов
    _.each(descriptor.children, function(childModuleId) {
        this.processEvents(childModuleId, null, on);
    }, this);
};


ClientApplication.prototype.bindEvents = function(moduleId, elementName) {
    this.processEvents(moduleId, elementName, true);
};


ClientApplication.prototype.unbindEvents = function(moduleId, elementName) {
    this.processEvents(moduleId, elementName, false);
};

/**
 * Attach or detach a handler to an event for the elements
 * You can declare function called "customBindElementEvents" to provide your binding events logic
 * @param  {String}   selector    A selector string to filter the descendants of the selected element that trigger the event
 * @param  {String}   elementName The name of element in BEM-style
 * @param  {Object}   container   Selected jQuery element that trigger the event
 * @param  {String}   eventName   One or more space-separated event types, such as "click"
 * @param  {Function} handler     A handler to triggering event
 * @param  {Boolean}  on          If this param is truthy, then attach handler. Otherwise detach handler
 */
ClientApplication.prototype._bindElementEvents = function(selector, elementName, container, eventName, handler, on) {
    var exceptions = ['scroll', 'block', 'error'], // Эти события нельзя подписывать как live, потому что они не всплывают
        method = on ? 'on' : 'off',
        selectorParam = elementName == 'block' ? null : selector;

    if (_.contains(exceptions, eventName)) {
        $(selector, container)[method](eventName, handler);
    } else {
        container[method](eventName, selectorParam, handler);
    }
};

function moduleBlockId(moduleId) {
    return '#module-' + moduleId;
}
