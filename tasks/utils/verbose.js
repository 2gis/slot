/**
 * Позволяет выводить информацию о состоянии тасок.
 */

var colors = require('colors/safe');
var gulp = require('gulp');
var _ = require('lodash');

var errors = [];
var massages = {};

/**
 * Задает тексты сообщения для задач
 *
 * @param   {String} name - название задачи
 * @param   {Object} meggases - объект сообщений
 *          {String} [meggases.start] - текст начала
 *          {String} [meggases.error] - текст при завершении с ошибкой
 *          {String} [meggases.success] - текст при успешном завершении
 */
exports.setMessages = function(name, meggases) {
    massages[name] = meggases;
};

/**
 * Включить режим показа текстов
 */
exports.enable = function() {
    gulp.on('task_start', function(task) {
        var name = task.task;
        if (massages[name] && massages[name].start) {
            console.log(colors.cyan(massages[name].start));
        }
    });

    gulp.on('task_stop', function(task) {
        var name = task.task;
        if (massages[name]) {
            if (_.contains(errors, name) && massages[name].error) {
                console.log(colors.bgRed(massages[name].error));
            }
            if (!_.contains(errors, name) && massages[name].success) {
                console.log(colors.bgGreen(massages[name].success));
            }
        }
    });

    gulp.on('task_err', function(task) {
        errors.push(task.task);
    });
};
