var _ = require('lodash');

module.exports = function(model) {
    var vm = {};

    vm.filters = [
        {label: 'All', value: 'all'},
        {label: 'Active', value: 'active'},
        {label: 'Completed', value: 'completed'}
    ];

    if (!model.activeFilter) {
        model.activeFilter = 'all';
    }

    _.find(vm.filters, {value: model.activeFilter}).active = true;

    vm.hideFooter = !model.todos.length;

    vm.remainingCount = _.reject(model.todos, 'completed').length;

    vm.completedCount = _.filter(model.todos, 'completed').length;

    return vm;
};