/**
 * Трэкер данных
 * @module components/StateTracker
 */

var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

module.exports = StateTracker;
function StateTracker(app) {
    if (this instanceof StateTracker) {
        EventEmitter.call(this);
    } else {
        return new StateTracker(app);
    }
}
inherits(StateTracker, EventEmitter);

StateTracker.prototype.resolveURL = function(url) {
    if (this.disabled) return;

    url = url || document.location.pathname;

    if (!history.emulate) { // если у нас не hash url, добавляем query string чтобы не потерялась
        url += location.search;
    }

    return url;
};

/**
 * Добавить состояние в историю браузера и поменять урл
 *
 * @param {String} method (push|replace)
 * @param {Object} newState
 * @param {String} [url]
 * @returns {boolean}
 */
StateTracker.prototype.add = function(method, newState, url) {
    if (this.disabled) return;

    var stop = false;
    var event = {
        method: method,
        state: newState,
        url: url,
        title: typeof document != 'undefined' ? document.title : null,
        cancel: function() {
            stop = true;
        }
    };
    this.emit('beforeAdd', event);
    if (stop || typeof history == 'undefined') return false;

    url = this.resolveURL(event.url);

    history[method + 'State'](_.cloneDeep(event.state), event.title, url);

    this.emit('afterAdd', event);

    this.applyState();
};

/**
 * Прилетел новый стэйт который нужно применить
 */
StateTracker.prototype.applyState = function() {
    var newState = history.state || {};
    this.emit('statechange', newState);
};

StateTracker.prototype.push = function(state, url) {
    this.add('push', state, url);
};

StateTracker.prototype.replace = function(state, url) {
    this.add('replace', state, url);
};

StateTracker.prototype.bind = function() {
    if (typeof window == 'undefined') return false;

    var self = this;
    $(window).on('popstate', function() {
        if (!self.disabled) {
            self.applyState();
        }
    });
    return true;
};

StateTracker.prototype.disable = function() {
    this.disabled = true;
};
