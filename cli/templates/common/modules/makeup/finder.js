// Вспомогательные функции для мейкапа
var _ = require('lodash');

module.exports = {
    // Находит путь до поля объекта obj с искомым значением findValue
    // findPathByValue({a: {b: {c: 'qwe'}}}, 'qwe') === 'a.b.c'
    findPathByValue: function(obj, findValue) {
        var arr = [],
            path = '';

        function recur(obj) {
            if (path) return;

            for (var key in obj) {
                var value = obj[key];

                if (_.isObject(value)) {
                    arr.push(key);
                    recur(value);
                } else if (value === findValue) {
                    arr.push(key);
                    if (!path) { // Only first match
                        path = arr.join('.');
                        return;
                    }
                }
            }

            arr.pop();
        }

        recur(obj);

        return path;
    },

    // Возвращает значение из объекта по пути path
    // getValueByPath({a: {b: {c: 'qwe'}}}, 'a.b.c') === 'qwe'
    getValueByPath: function(obj, path) {
        var arr = path.split('.'),
            result = obj;

        for (var i = 0 ; i < arr.length ; i++) {
            result = _.clone(result[arr[i]]);
        }

        return result;
    }
};