
var _ = require('lodash');
var AsyncEmitter = require('async.emitter');
var StateApi = require('./api');
var makeAlias = require('./uri/helpers').makeAlias;
var parser = require('./uri/parser');
var resolver = require('./uri/resolver');
var stuff = require('../../lib/stuff');
var inherits = require('inherits');
var eq = require('deep-equal');
var cmp = require('../../lib/cmp');
var StateConf = require('./stateConf');

var FinalStateApi = null;

/**
 * Компонент реализует стэйт приложения.
 *
 * Приложение имеет некоторый стэйт и UI соответствующий ему.
 * Стэйт, который равен UI называется actualState.
 * С помощью различных методов аппстейта можно изменить текущий стэйт.
 * Изменения аккумулируются в wantedState.
 *
 * Далее при пуше или реплейсе компаратор сравнивает wantedState и actualState и применяет полученный diff.
 * После этого считается что UI обновился и actualState становится равным wantedState.
 *
 * Насчет prevState, сейчас есть костыль, и actualState обновляется _перед_ применения diff'а,
 * а иметь предыдущий стэйт на момент применения diff'а хочется. Поэтому есть prevState который на момент применения
 * diff'а реально равен предыдущему стэйту (а не текущему как actualState).
 *
 * @param {Application} app
 * @param {StateTracker} $stateTracker компонент трэкающий стэйт
 * @returns {AppState}
 * @constructor
 */
function AppState(app, $stateTracker) {
    if (this instanceof AppState) {
        AsyncEmitter.call(this);
        setStateApi();
        FinalStateApi.call(this, this.app);
        this.app = app;

        // выставляем дефолтный компаратор
        this.comparator = cmp.states;
        // конфижим пустым конфигом
        this.configure({});

        this.lockCounter = 0;

        // последний тип пуша в историю
        this.lastAddType = null;

        // prevState синхронизуется с новым стейтом после того, как выполнятся все changeState'ы
        this.prevState = {};
        // actualState хранит в себе последнее состояние ДО пуша нового стейта и синхронизируется ПЕРЕД changeState'ами
        this.actualState = {};

        this.uriAliases = [];

        this.bind($stateTracker);
    } else {
        return new AppState(app, $stateTracker);
    }
}
inherits(AppState, AsyncEmitter);

AppState.prototype.getActualState = function() {
    return this.actualState;
};

AppState.prototype.getPrevState = function() {
    return this.prevState;
};

/**
 * Переопределяет компаратор для стэйта
 * @param {function} comparator
 */
AppState.prototype.setComparator = function(comparator) {
    this.comparator = comparator;
};

/**
 * Выставляет конфиг для стэйта
 *
 * Если будет передана простой конфиг, то экземпляр класса StateConf будет инстациирован автоматически
 * @param {StateConf|object} stateConf конфиг для стэйта в виде экземпляра StateConf или простой конфигурации
 */
AppState.prototype.configure = function(stateConf) {
    if (stateConf instanceof StateConf) {
        this.stateConf = stateConf;
    } else {
        this.stateConf = new StateConf(stateConf);
    }
};

AppState.prototype.bind = function(stateTracker) {
    var self = this;

    this.stateTracker = stateTracker;

    stateTracker.bind();

    stateTracker.on('statechange', function(newState) {
        self.assign(_.cloneDeep(newState)); // нужно если мы навигируем по истории
        self.emit('beforestatechange');

        var diff = self.comparator(self.actualState, newState);
        if (DEBUG && stuff.logEnabledFor('history')) {
            var displayAction = self.lastAddType || 'popstate';
            console.groupCollapsed(displayAction + ',', 'diff:', _.keys(diff));
            stuff.log('history', 'actual:', JSON.stringify(self.actualState));
            stuff.log('history', 'newone:', JSON.stringify(newState));
            stuff.log('history', 'diff:', diff);
            console.groupEnd();
        }
        self.lastAddType = null;

        // @TODO: По-хорошему, actualState нужно обновлять ПОСЛЕ всех changeState, чтоб во время changeState он хранил предыдущее состояние
        // @TODO: но, т.к. в changeState'ах мы делаем state.replace'ы, придется завести отдельную переменную prevState
        self.actualState = _.cloneDeep(newState); // update actual state AFTER emit statechange
        self.emit('statechange', diff, newState); // apply state
        self.prevState = self.actualState;
    });
};

AppState.prototype.parse = function(url, callback) {
    var self = this,
        stateConf = this.stateConf,
        patterns = stateConf.patterns,
        aliases = this.uriAliases;

    function parse() {
        return parser.parse(patterns, url, aliases);
    }

    function parseAndInject() {
        var state = {};
        var slugEntries = parse();
        stateConf.invokeInjectors(slugEntries, state, self);

        return state;
    }

    // создаем временный стэйт для нужд парсера
    var stateApi = new FinalStateApi(this.app);
    stateApi.parse = parse;
    stateApi.addUriAlias = _.bind(this.addUriAlias, this);

    this.emitSeries('parse', stateApi, function() {
        // когда все добавили алиасы которые хотели финально парсим строку в стэйт
        var state = parseAndInject();

        stateApi.defaults(state);

        callback.call(self, stateApi.state, stateApi);
    });
};

AppState.prototype.init = function(url, callback) {
    var self = this;
    this.parse(url, function(state, stateApi) {
        this.emitSeries('init', stateApi, function() {
            self.assign(state, true);

            self.stateTracker.replace(state, self.getUri());

            self.actualState = _.cloneDeep(state);
            callback.call(self, state);
        });
    });
};

AppState.prototype.getUri = function(state) {
    state = state || this.getShareState();
    return '/' + resolver(this.stateConf, state, this.uriAliases);
};

AppState.prototype.addUriAlias = function(pattern, params, alias) {
    this.uriAliases.push(makeAlias(pattern, params, alias));
};

/**
 * Начать транзакцию, после которой будут заблокированы все изменения в историю
 *
 * Транзакции могут быть вложенными
 */
AppState.prototype.begin = function() {
    this.lockCounter++;
};

/**
 * Закончить транзакцию
 */
AppState.prototype.end = function() {
    if (this.lockCounter != 0) this.lockCounter--;
};

/**
 * Добавить запись в историю
 *
 * @param {String} type Возможные значения 'push' или 'replace'
 * @param {Function} [handler] функция которая будет выполнена в транзакции (в который будут заблокированы изменения в историю)
 * @param {Boolean} [force] сделать изменение в историю даже если actualState равен wantedState
 *
 * @returns {Boolean} была ли сделана запись в историю
 */
AppState.prototype.add = function(type, handler, force) {
    if (typeof handler != 'function') {
        force = handler;
        handler = null;
    }

    if (handler) {
        this.begin();
        handler();
        this.end();
    }

    if (this.lockCounter) return false;

    // нет смысла пушить в историю тоже самое
    var wantedState = this.getState();
    var diff = this.comparator(this.getActualState(), wantedState);
    if (!force && !_.size(diff)) return false;
    this.lastAddType = type;

    this.emit('beforeadd', type, diff);

    this.stateTracker.add(type, this.getState(), this.getUri());

    return true;
};

AppState.prototype.push = function(handler, force) {
    return this.add('push', handler, force);
};

AppState.prototype.replace = function(handler, force) {
    return this.add('replace', handler, force);
};

/**
 * Актуализировать часть стейта из wantedState
 *
 * @param {String} name Название части стейта (например 'callout')
 * @returns {Boolean} false если состояния и так уже равны
 */
AppState.prototype.actualize = function(name) {
    var wantedState = this.get(name);
    if (eq(this.actualState[name], wantedState)) return false;

    this.actualState[name] = _.cloneDeep(wantedState);
    return true;
};

function setStateApi(Api) {
    if (!FinalStateApi) {
        FinalStateApi = Api || StateApi;
        for (var key in FinalStateApi.prototype) {
            AppState.prototype[key] = FinalStateApi.prototype[key];
        }
    }
}

AppState.setStateApi = setStateApi;

module.exports = AppState;
