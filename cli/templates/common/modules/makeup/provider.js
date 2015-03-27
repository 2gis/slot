// Доступ до данных, всё знает про пути в объекте contextData и обходит отсутствие ключей

var _ = require('lodash'),
    manifest = req('build/private/manifest');

var contextData;

module.exports = {
    init: function(data) {
        contextData = data;
    },

    mock: function(name, type) {
        var data = contextData['modules'][name];

        return data.initData && data.initData[type] && data.initData[type].__apiData;
    },

    _data: function(name) {
        return contextData['modules'][name] || {};
    },

    context: function(name, type) {
        return this._data(name).context[type];
    },

    helperArgs: function(name, type) {
        var data = contextData['helpers'][name];

        return data.initData[type];
    },

    _setMods: function(name, type) {
        var data = this._data(name);

        function set(mods) {
            _.each(mods, function(value, key) {
                $('.makeup__root').addClass('_' + key + '_' + value + ' _' + key);
            });
        }

        var commonMods = data.config && data.config.types && data.config.mods;
        if (commonMods) {
            set(commonMods);
        }

        var typeMods = data.config && data.config.types && data.config.types[type] && data.config.types[type].mods;
        if (typeMods) {
            set(typeMods);
        }
    },

    _snippet: function(name, type, instance) {
        var data = this._data(name);
        var typesKey = instance ? 'initTypes' : 'types';

        var cfgType = data.config[typesKey] && data.config[typesKey][type] || {};
        var pseudoSlot = {
            mod: function(mods) {
                _.each(mods, function(value, key) {
                    var cls = '_' + key + '_' + value + ' _' + key;
                    if (value === false || value == null) {
                        $('.makeup__root').removeClass(cls);
                    } else {
                        $('.makeup__root').addClass(cls);
                    }
                });
            }
        };
        var slot = instance && instance.slot || pseudoSlot;

        if (cfgType.snippet) {
            cfgType.snippet(slot, instance);
        }
    },

    afterEffects: function(name, type, instance) {
        this._setMods(name, type);
        this._snippet(name, type, instance);
    },

    initData: function(name, type) {
        var data = contextData['modules'][name];

        return _.cloneDeep(data.initData[type]);
    },

    // viewContext for submodule
    sctx: function(self, submoduleName) {
        var submodule = contextData['modules'][submoduleName]; // Вложенный модуль может быть в шаблоне, но его может не быть в данных - это теперь нормально

        if (submodule) {
            return submodule.context[self['__' + submoduleName]];
        } else {
            return {};
        }
    },

    // Флаг, который отключает мокание компонент на этапе загрузки и рендеринга модуля
    natural: function(name, type) {
        var data = contextData['modules'][name];
        return data.config && data.config.natural;
    }
};