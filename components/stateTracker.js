
/**
 * Трэкер данных
 **/
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var config = require('../config');
var env = require('slot/env');

function StateTracker(app) {
    if (this instanceof StateTracker) {
        EventEmitter.call(this);

        this.lastUrl = null;
    } else {
        return new StateTracker(app);
    }
}
inherits(StateTracker, EventEmitter);

StateTracker.prototype.resolveURL = function(url) {
    return url || decodeURIComponent(document.location.pathname);
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
    var stop = false;
    var event = {
        method: method,
        state: newState,
        url: url,
        cancel: function() {
            stop = true;
        }
    };
    this.emit('beforeAdd', event);
    if (stop || typeof history == 'undefined') return false;

    url = this.resolveURL(url);

    this.lastUrl = url;

    var stateToPush = _.cloneDeep(newState);


    if (history.emulate) { // если у нас hash url, обрезаем query string, так как она должна быть в начале
        var queryStringPosition = url.indexOf('?');
        if (queryStringPosition !== -1) {
            url = url.substr(0, queryStringPosition);
        }
    }

    var dontTouchUrl = config['stateTracker.dontTouchUrl'];

    history[method + 'State'](stateToPush, document.title, !dontTouchUrl ? url : null);

    event.url = url;
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

StateTracker.prototype.push = _.partial(StateTracker.prototype.add, 'push');
StateTracker.prototype.replace = _.partial(StateTracker.prototype.add, 'replace');

StateTracker.prototype.bind = function() {
    if (typeof window == 'undefined') return false;

    var self = this;

    $(window).on('popstate', function() {
        self.applyState();
    });
    return true;
};

module.exports = StateTracker;
