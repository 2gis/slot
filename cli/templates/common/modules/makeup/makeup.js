var adapter = require('./adapter');
var templateProvider = require('slot/lib/templateProvider');
var manifest = req('build/private/manifest');
var handlebars = require('handlebars');

module.exports = function(slot) {
    var context,
        ui,
        currentModule, // Набор шаблонов для текущего модуля, может меняться при использовании handlebars-хелпера 'module'
        contextData;

    var cp = require('./provider');

    function getItemType(name) {
        var type = 'module';

        if (_.contains(manifest.blocks, name)) {
            type = 'block';
        }

        return type;
    }

    /**
     * Колбек из мейкапа
     *
     * @param {object} item конфиг и данные
     * @param {number} groupId - группа (блоки, модули или хелперы: [0, 1, 2])
     * @param {number} itemId - id элемента внутри группы
     * @param {number} typeGroupId - id группы типов данных ([context, initData])
     * @param {number} typeId - id конкретного типа данных
     */
    function show(item, groupId, itemId, typeGroupId, typeId) {
        var name = item.modulename,
            type = item.typename,
            container = this.el.containerMarkup;

        var label = this._params.data[groupId].items[itemId].items[typeGroupId].label;
        var tag = this._params.data[groupId].items[itemId].tag || 'div';

        container.empty();

        switch (groupId) {
            // Module
            case 0:
                if (label == 'context') { // context ?
                    showBlock(container, name, type, tag);
                } else if (label == 'initData') { // initData
                    showModule(container, name, type);
                }
                break;

            // Helper
            case 1:
                showHelper(container, name, type);
                break;
        }
    }

    /**
     * Инициализирует и отрисовывает независимый блок проекта, включая модуль как блок
     * @param  {[type]} container   куда вывести отренденный блок
     * @param  {[type]} name        имя блока
     * @param  {[type]} type        имя контекста для блока
     * @return {[type]}
     */
    function showBlock(container, name, type, tag) {
        var templates = templateProvider.forModule(name, handlebars),
            block = templates[name]; // Там могут быть партиалы, поэтому два раза

        currentModule = templates;
        utils.registerHelpers();

        var cls = name;

        var ctx = cp.context(name, type);
        var html = '<' + tag + ' class="' + cls + ' makeup__root">' + block(ctx) + '</' + tag + '>';

        container.append(html);

        cp.afterEffects(name, type);
    }

    /**
     * Инициализирует модуль
     */
    function showModule(container, name, type) {
        slot.init(name, cp.initData(name, type), function(err, initedModule) {
            if (err) {
                console.warn('Cannot render module ' + name + '. Error raised: ', err);
                return;
            }

            container.html(initedModule.render());

            initedModule.bindEvents();
            initedModule.bind();

            cp.afterEffects(name, type, initedModule);
        });
    }

    /**
     * Инициализирует хелпер
     */
    function showHelper(container, name, type) {
        var template = templateProvider.resolve('helpers', name, handlebars);
        var data = cp.helperArgs(name, type);
        var viewModel = req('helpers/blocks/' + name + '/' + name);
        var context = viewModel.apply(this, data.args);
        var html = template(context);

        container.html(html);
        // cp.afterEffects(name, type);
    }

    var utils = {
        registerHelpers: function(name, data) {
            handlebars.registerHelper('module', function(submoduleName) {
                if (!submoduleName) return 'NULL';

                var submodule = templateProvider.forModule(submoduleName, handlebars);
                var blockTemplate = submodule[submoduleName];
                var itemType = getItemType(submoduleName);
                var submoduleContext = cp.sctx(this, submoduleName);

                // Перемещаем контекст шаблонов в дочерний модуль
                var parentModule = currentModule;
                currentModule = submodule;
                var html = blockTemplate.call(this, submoduleContext);
                currentModule = parentModule;

                html = '<div class="' + submoduleName + '">' + html + '</div>';
                if (!submoduleContext) html = '';

                return new handlebars.SafeString(html);
            });

            handlebars.registerHelper('p', function() { // Подключение партиала, выполняется в контексте текущего модуля module
                var partial = currentModule[_.find(arguments, function(name) {
                    return currentModule[name];
                })];
                var context = arguments[arguments.length - 1].hash.context || this;

                var html = partial.call(this, context);

                return new handlebars.SafeString(html);
            });

            handlebars.registerHelper('mods', function() { // Модификаторы элементов
                return '';
            });
        }
    };

    var makeup = {

        init: function(request) {
        },

        clientInit: function() {
            var data = adapter();
            // handlebars = app.handlebars;
            contextData = data.contextData;
            cp.init(contextData);
            console.log('data.makeupContext', data.makeupContext);

            ui = new Makeup({
                wrapper: slot.block(),
                renderModule: show,
                data: data.makeupContext
            });
        },

        elements: {},
        interface: {}
    };

    return makeup;
};
