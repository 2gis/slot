// Собирает данные по проекту и возвращает мастер-объект для инициализации библиотеки makeup

var _ = require('lodash'),
    manifest = req('build/private/manifest');

module.exports = function() {
    var contextData = {};

    /**
     * parseGroup
     */
    function parseGroup(key, path) {
        contextData[key] = {}; // Набиваем через замыкания чтоб не упираться в производительность (понадобится второй прогон реквайров тяжелых данных)

        return _.compact(_.map(manifest[key], function(name) {
            var group = {},
                config,
                context,
                initData;

            try {
                config = req(path + name + '/data/config');
            } catch (e) {}

            try {
                context = req(path + name + '/data/context');
            } catch (e) {}

            try {
                initData = req(path + name + '/data/initData');
            } catch (e) {}

            if (!context && !initData) return; // Если нет никаких данных, значит модуль или блок не готов к показу в мейкапе

            // Добавляем null типы
            if (context && typeof context['null'] == 'undefined') context['null'] = null;
            if (initData && typeof initData['null'] == 'undefined') initData['null'] = null;

            // Build config
            var types = parseTypes(name, config, context, initData);

            // @TODO сделать вывод всех типов
            // if (context) {
            //     delete context.format;
            // }
            contextData[key][name] = {
                config: config,
                context: context,
                initData: initData
            };

            return {
                name: name || '',

                documentation: config && config.documentation,
                styles: config && config.styles,
                tag: config && config.tag,

                types: types.length ? types : undefined
            };
        }));
    }

    /**
     * Формируем массив с типами
     */
    function parseTypes(name, config, context, initData) {
        var out = [];
        // Выпиливаем ключ format
        var contextTypes = _.remove(getType(config, name, context), function(type) {
            return type.name != 'format';
        });
        var initTypes = getType(config, name, initData, 'initData');

        if (contextTypes.length) {
            out.push({
                label: 'context',
                items: contextTypes
            });
        }

        if (initTypes.length) {
            out.push({
                label: 'initData',
                items: initTypes
            });
        }

        return out;
    }

    /**
     * Получаем отформатированный массив типов одной категории для модуля
     */
    function getType(config, name, collection, type) {
        var typesArray = [];

        _.each(collection, function(item, key) {
            var out = {
                    name: key,
                    image: '/assets/' + name + '/_' + name + '_type_' + key + '.png'
                },
                configKey = type == 'initData' ? 'initTypes' : 'types';


            if (config && config[configKey] && config[configKey].hasOwnProperty(key)) {
                out = _.merge(out, _.omit(config[configKey][key], 'snippet'));
            }

            typesArray.push(out);
        });

        return typesArray;
    }

    var makeupContext = [{
        label: 'Modules',
        items: parseGroup('modules', 'modules/')
    }, {
        label: 'Helpers',
        items: parseGroup('helpers', 'helpers/blocks/')
    }];

    return {
        makeupContext: makeupContext,
        contextData: contextData
    };
};
