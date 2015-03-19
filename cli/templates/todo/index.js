var path = require('path');
var del = require('del');
var ncp = require('ncp').ncp;

module.exports = {
    name: 'todo',
    description: 'TODO list. Example Slot application',
    params: {},
    deploy: function(dest, props, callback) {
        var basicTemplate = require('../basic');
        var source = path.join(__dirname, 'files');

        // Разворачиваем basic-приложение
        basicTemplate.deploy(dest, props, function(err) {
            if (err) {
                return callback(err);
            }

            // Удаляем модули basic-приложения
            del(path.join(dest, '/modules'), function(err) {
                if (err) {
                    return callback(err);
                }

                // Копируем модули TODO-листа
                ncp(source, dest, callback);
            });
        });
    }
};
