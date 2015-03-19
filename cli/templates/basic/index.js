var fs = require('fs');
var path = require('path');
var ncp = require('ncp').ncp;

module.exports = {
    name: 'basic',
    description: 'A basic Hello World Slot.js app',
    params: {},
    deploy: function(dest, props, callback) {
        var source = path.join(__dirname, 'files');

        // Копируем файлы приложения
        ncp(source, dest, function(err) {
            if (err) {
                callback(err);
            }

            // Создаём пустые папки для компонентов и ассетов
            fs.mkdirSync(path.join(dest, '/components'));
            fs.mkdirSync(path.join(dest, '/public'));
            callback();
        });
    }
};
