/**
 * @module env
 */

require('./lib/shim.js');
var events = require('events');
var _ = require('lodash');

var isServer = typeof window == 'undefined',
    rootPath = './',
    buildPath;

if (!isServer) {
    window.global = window;
}

exports.slotPath = __dirname;

/**
 * @type {global}
 */
exports.global = global;

var envConfig = {};
global.DEBUG = false;
exports.getConfig = function() {
    return envConfig;
};

exports.mergeConfig = function(toMergeConfigs) {
    function merge(cfg, upstream) {
        for (var key in upstream) {
            if (upstream.hasOwnProperty(key)) {
                var value = upstream[key];
                var doPush = false;
                if (key.charAt(0) == '+') {
                    doPush = true;
                    key = key.substr(1);
                }

                var origin = cfg[key];
                if (doPush && key in cfg && _.isArray(origin)) {
                    origin.push.apply(origin, value);
                } else {
                    cfg[key] = value;
                }
            }
        }
        return cfg;
    }

    _.reduce(toMergeConfigs, merge, envConfig);
    global.DEBUG = envConfig.debug;
};

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
 * @memberof module:env
 *
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
 * Запрашивает модуль относительно папки куда складываются собираемые файлы.
 *
 * @private
 *
 * @param {string} path
 */
function requireFromBuild(path) {
    return require(getBuildPath() + path);
}

/**
 * Запрашивает модуль относительно папки, куда складываются собираемые приватные файлы.
 *
 * @memberof module:env
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

var vars = {},
    varsObserver = new events.EventEmitter();

/**
 * Читает переменную окружения. Если переменная не определена - бросает ошибку.
 *
 * @private
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
 * @private
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
 *
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

/**
 * @type {boolean}
 */
exports.isServer = isServer;

/**
 * @type {boolean}
 */
exports.isClient = !isServer;

global.req = exports.require;
global.requirePrivate = requirePrivate;
