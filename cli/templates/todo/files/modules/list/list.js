/**
 * Список задач
 */
var _ = require('lodash');

module.exports = function(slot) {
    var model = {},
        viewModel = require('./viewModel.js');

    var list = {
        init: function(data, callback) {
            model = data;

            // Заполняем начальными данными
            model.todos = [{
                title: 'Чай',
                completed: true,
                id: 0
            }, {
                title: 'Сахар',
                completed: false,
                id: 1
            }, {
                title: 'Конфетки',
                completed: false,
                id: 2
            }];

            // Инитим модули
            _.each(model.todos, function(todo) {
                todo.module = slot.init('todoItem', todo);
            });

            callback();
        },

        viewContext: function() {
            return viewModel(model);
        },

        interface: {
            /**
             * Добавить задачу
             *
             * @param title Текст нового элемента списка
             */
            addTodo: function(title) {
                var todo = {
                    title: title,
                    completed: false,
                    id: model.todos.length ? _.last(model.todos).id + 1 : 0
                };
                todo.module = slot.init('todoItem', todo);
                model.todos.push(todo);

                slot.rerender();
                slot.notify('changed', model);
            },

            /**
             * Показать все, невыполненные или выполненные
             *
             * @param {string} filter all|active|completed
             */
            filter: function(filter) {
                model.activeFilter = filter;

                slot.rerender();
                slot.notify('changed', model);
            },

            /**
             * Отметить все выполненными или невыполненными
             */
            toggleAll: function() {
                var allCompleted = _.every(model.todos, 'completed');

                _.each(model.todos, function(todo) {
                    todo.completed = !allCompleted;
                    todo.module.slot.mod({completed: todo.completed});
                });

                slot.rerender();
                slot.notify('changed', model);
            },

            /**
             * Удалить выполненные
             */
            clearCompleted: function() {
                model.todos = _.reject(model.todos, 'completed');

                slot.rerender();
                slot.notify('changed', model);
            }
        },

        dispatcher: {
            // когда начинают редактировать какой-то элемент, отменяем редактирование других
            'todoItem:startEditing': function() {
                slot.broadcast('todoItem:stopEditing');
            },

            'todoItem:removed': function(todo) {
                model.todos = _.reject(model.todos, {id: todo.id});

                slot.rerender();
                slot.notify('changed');
            },

            'todoItem:completed': function() {
                slot.rerender();

                slot.notify('changed');
            }
        }
    };

    return list;
};
