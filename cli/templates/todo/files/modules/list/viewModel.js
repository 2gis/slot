var _ = require('lodash');

module.exports = function(model) {
    var vm = {};

    if (model.activeFilter == 'active') {
        vm.filteredTodos = _.filter(model.todos, {completed: false});
    } else if (model.activeFilter == 'completed') {
        vm.filteredTodos = _.filter(model.todos, 'completed');
    } else {
        vm.filteredTodos = _.clone(model.todos);
    }

    return vm;
};
