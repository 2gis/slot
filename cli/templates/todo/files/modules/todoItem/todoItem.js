var _ = require('lodash');

module.exports = function(slot) {
    var model = {},
        viewModel = require('./viewModel.js');

    function saveChanges() {
        var editing = slot.mod().editing;
        if (!editing) {
            return;
        }

        slot.mod({editing: false});
        model.title = slot.element('editTodoInput').val();
        slot.element('title').html(model.title);
    }

    var todoItem = {
        init: function(data, callback) {
            model = data;

            slot.mod({completed: !!model.completed});

            callback();
        },

        viewContext: function() {
            return viewModel(model);
        },

        // добавляем сюда все элементы, для которых нужна обработка событий,
        elements: {
            // отметить выполненной одну задачу
            toggleCompleted: {
                click: function() {
                    model.completed = !model.completed;
                    slot.mod({completed: model.completed});

                    slot.notify('completed');
                }
            },

            // крестик при наведении на элемент списка
            remove: {
                click: function() {
                    slot.notify('removed', model);
                    slot.dispose();
                }
            },

            title: {
                // двойной клик по тексту задачи включает редактирование
                dblclick: function() {
                    slot.notify('startEditing');

                    slot.mod({editing: true});

                    slot.element('editTodoInput').val(model.title);
                }
            },

            editTodo: {
                // сохранение отредактированной задачи
                submit: function(e) {
                    e.preventDefault();

                    saveChanges();
                }
            },

            editTodoInput: {
                // отмена редактирования
                keydown: function(e) {
                    if (e.keyCode == 27) {
                        $(this).val(model.title);
                        slot.mod({editing: false});
                    }
                },

                // при потере фокуса сохраняем
                blur: function() {
                    saveChanges();
                }
            }
        },

        interface: {
            stopEditing: function() {
                saveChanges();
            }
        }
    };

    return todoItem;
};
