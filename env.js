
var rootPath = './',
    buildPath,
    events = require('events'),
    _ = require('lodash');

require('./polyfill');

exports.setRootPath = function(path) {
    rootPath = path;
    if (!rootPath.endsWith('/')) {
        rootPath = rootPath + '/';
    }
};

exports.getRootPath = function() {
    return rootPath;
};

exports.setBuildPath = function(path) {
    buildPath = path;
};

function getBuildPath() {
    return buildPath || rootPath + 'build/';
}

/**
 * Запрашивает модуль относительно корня проекта
 *
 * @param name
 * @returns {*}
 */
exports.require = function(name) {
    if (!name.endsWith('.js') && !name.endsWith('.json')) {
        name = name + '.js';
    }
    return require(rootPath + name);
};

/**
 * Возвращает глобальный контекст среды исполнения (в node.js или браузере)
 *
 * @returns {global|window}
 */
function globals() {
    return typeof global != 'undefined' ? global : window;
}

exports.globals = globals;

/**
 * Запрашивает модуль относительно папки куда складываются собираемые файлы
 *
 * @param name
 * @returns {*}
 */
exports.requirePrivate = function(name) {
    return require(getBuildPath() + 'private/' + name + '.js');
};

var isServer = typeof window == 'undefined';

/**
 * Определяем, Грым ли это (Грым это десктопная версия 2gis).
 */
exports.isGrym = typeof DGOfflineAPI != 'undefined' && !!DGOfflineAPI.systemContext;
exports.isServer = isServer;
exports.isClient = !isServer;

function envRequire(serverName, clientName) {
    if (isServer) {
        return require(serverName);
    } else {
        if (!clientName) {
            clientName = serverName.charAt(0).toUpperCase() + serverName.substr(1);
            clientName = window[clientName] ? clientName : serverName;
        }
        return window[clientName];
    }
}

var conf = {};
var confEmitter = new events.EventEmitter();

/**
 * Настройка окружения некоторым значением
 * @param {object} cfg
 */
function _set(name, value) {
    if (name in conf) {
        throw new Error("Environment field " + name + " already configured");
    }
    conf[name] = value;
    confEmitter.emit(name, value);
}

/**
 * Берем что-либо из настроенного окружения
 *
 * Если значения нет - бросаем ошибку, мол, не все проинициализировали
 * @param name
 */
function _get(name) {
    if (name in conf) {
        return conf[name];
    }
    throw new Error("Environment not configured for " + name + " field");
}

/**
 * Настройка окружения некоторым конфигом
 * @param {object} cfg
 */
exports.setup = function(cfg) {
    for (var name in cfg) {
        if (cfg.hasOwnProperty(name)) {
            _set(name, cfg[name]);
        }
    }
};

exports.get = _get;
exports.set = _set;

exports.onceConfigured = function(name, callback) {
    if (name in conf) {
        callback(conf[name]);
    } else {
        confEmitter.once(name, callback);
    }
};


// ---- expose same functions as globals -----

globals().req = exports.require;
globals().envRequire = envRequire;
globals().requirePrivate = exports.requirePrivate;

if (!Object.freeze) Object.freeze = _.identity;

