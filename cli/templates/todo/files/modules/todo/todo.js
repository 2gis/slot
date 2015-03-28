/**
 * Главный модуль. Подключает модуль списка задач (list). Кроме него, включает фильтры, поле добавления новой задачи, кнопку для удаления выполненных и пр.
 */
var _ = require('lodash');

module.exports = function(slot, $appState) {
    var model = {},
        viewModel = require('./viewModel.js');

    var config = slot.config;

    function highlightFilterLink(type) {
        slot.element('filtersItemLink')
            .mod({selected: false});

        slot.element('filtersItemLink')
            .filter('[data-value="' + type + '"]')
            .mod({selected: true});
    }

    var todo = {
        init: function(data, callback) {
            var filterState = $appState.get('filter');
            var filterType = filterState ? filterState.type : 'all';

            model.activeFilter = filterType;

            // подключаем модуль списка задач
            slot.init('list', model, callback);
        },

        clientInit: function() {
            highlightFilterLink(model.activeFilter);
        },

        viewContext: function() {
            return viewModel(model);
        },

        // добавляем сюда все элементы, для которых нужна обработка событий,
        // и все элементы, к которым обращаемся через slot.element()
        elements: {
            remainingNumber: {},
            addInput: {},
            footer: {},

            // форма для добавления новой задачи
            add: {
                submit: function(e) {
                    e.preventDefault();

                    var input = slot.element('addInput');
                    var title = input.val();
                    input.val('');

                    slot.broadcast('list:addTodo', title);
                }
            },

            // отмечает все выполненными или наоборот
            toggleAll: {
                click: function() {
                    slot.broadcast('list:toggleAll');
                }
            },

            // кнопка "Clear completed"
            clearCompleted: {
                click: function() {
                    slot.broadcast('list:clearCompleted');
                }
            },
            clearCompletedNumber: {},

            // ссылки внизу: "All", "Active", "Completed"
            filtersItemLink: {
                click: function(e) {
                    $appState.set('filter', {
                        type: $(this).data('value')
                    });

                    $appState.push();

                    e.preventDefault();
                }
            }
        },

        dispatcher: {
            // вызывается, если что-то поменялось в списке задач (добавилось, удалилось, поменяло статус)
            '*:changed': function() {
                // скрываем футер, если нет задач
                var hideFooter = !model.todos.length;

                if (!hideFooter) {
                    // обновляем количество невыполенных задач
                    var notCompleted = _.reject(model.todos, 'completed');
                    slot.element('remainingNumber').html(notCompleted.length);

                    var completed = _.filter(model.todos, 'completed');
                    // скрываем кнопку "Clear completed", если нет выполненных задач
                    slot.element('clearCompleted').mod({hidden: !completed.length});
                    // обновляем количество выполненных задач
                    slot.element('clearCompletedNumber').html(completed.length);
                }

                slot.element('footer').mod({hidden: hideFooter});
            }
        },

        changeState: function(diff) {
            if ('filter' in diff) {
                var type = diff.filter.type;

                highlightFilterLink(type);

                slot.broadcast('list:filter', type);
            }
        }
    };

    return todo;
};
