var SlotAppState = require('slot/components/appState');
var inherits = require('inherits');
var conf = require('./conf');

inherits(AppState, SlotAppState);
function AppState(app, stateTracker) {
    SlotAppState.call(this, app, stateTracker);

    // Конфигурируем компонент нашим конфигом
    this.configure(conf);
}

module.exports = function(app, $stateTracker) {
    return new AppState(app, $stateTracker);
};
