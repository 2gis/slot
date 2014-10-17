require('./shim.js');

var rootPath = './',
    buildPath,
    events = require('events'),
    _ = require('lodash');

var isServer = typeof window == 'undefined';

if (!isServer) {
    window.global = window;
}

var rootPath = './';

/**
 * @type {global}
 */
exports.global = global;

/**
 * @returns {string}
 */
exports.getRootPath = function() {
    return rootPath;
};

/**
 * @param {string} path
 */
exports.setRootPath = function(path) {
    rootPath = path.endsWith('/') ? path : path + '/';
};

/**
 * @returns {string}
 */
function getBuildPath() {
    return buildPath || rootPath + 'build/';
}

exports.getBuildPath = getBuildPath;

/**
 * @param {string} path
 */
exports.setBuildPath = function(path) {
    buildPath = path;
};

/**
 * Запрашивает модуль относительно корня проекта.
 *
 * @param {string} name
 * @returns {*}
 */
exports.require = function(name) {
    if (!name.endsWith('.js') && !name.endsWith('.json')) {
        name = name + '.js';
    }
    return require(rootPath + name);
};

/**
 * Запрашивает модуль относительно папки куда складываются собираемые файлы
 *
 * @param {string} path
 */
function requireFromBuild(path) {
    return require(getBuildPath() + path);
}

/**
 * Запрашивает модуль относительно папки, куда складываются собираемые приватные файлы.
 *
 * @param {string} path
 * @returns {*}
 */
function requirePrivate(path) {
    return requireFromBuild('private/' + path);
}

exports.requirePrivate = requirePrivate;

/**
 * Запрашивает модуль относительно папки, куда складываются собираемые публичные файлы.
 *
 * @param {string} path
 * @returns {*}
 */
exports.requirePublic = function(path) {
    return requireFromBuild('public/' + path);
};

/**
 * @param {string} serverName
 * @param {string} clientName
 * @returns {*}
 */
function envRequire(serverName, clientName) {
    if (isServer) {
        return require(serverName);
    } else {
        if (!clientName) {
            clientName = serverName.charAt(0).toUpperCase() + serverName.slice(1);
            clientName = window[clientName] ? clientName : serverName;
        }
        return window[clientName];
    }
}

var vars = {},
    varsObserver = new events.EventEmitter();

/**
 * Читает переменную окружения. Если переменная не определена - бросает ошибку.
 *
 * @param {string} name
 * @returns {*}
 */
function _get(name) {
    if (!(name in vars)) {
        throw new Error('Environment variable "' + name + '" not defined');
    }
    return vars[name];
}

exports.get = _get;

/**
 * Устанавливает переменную окружения.
 *
 * @param {string} name
 * @param {*} value
 */
function _set(name, value) {
    if (name in vars) {
        throw new Error('Environment variable ' + name + ' already configured');
    }
    vars[name] = value;
    varsObserver.emit(name, value);
}

exports.set = _set;

/**
 * Настройка окружения.
 * @param {Object} conf
 */
exports.setup = function(conf) {
    for (var name in conf) {
        if (conf.hasOwnProperty(name)) {
            _set(name, conf[name]);
        }
    }
};

/**
 * Подписка на определение переменной окружения. Срабатывает немедленно, если переменная уже определена.
 *
 * @param {string} name
 * @param {Function} callback
 */
exports.whenSet = function(name, callback) {
    if (name in vars) {
        callback(vars[name]);
    } else {
        varsObserver.once(name, callback);
    }
};

exports.isServer = isServer;
exports.isClient = !isServer;

global.req = exports.require;
global.requirePrivate = requirePrivate;
global.envRequire = envRequire;
