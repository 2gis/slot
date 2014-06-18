var _ = require('underscore'),
    templateProvider = require('./templateProvider'),
    env = require('./env'),
    stuff = require('./stuff');

/**
 * Регистрирует хэлперблоки
 *
 * Должны лежать в проекте по пути helpers/blocks/
 * @param handlebars
 */
function registerHelperBlocks(handlebars) {
    var helpers = templateProvider.getStorage('helpers');
    _.each(helpers, function(tmplSpec, name) {
        handlebars.registerHelper(stuff.capitalize(name), function() {
            var helper = env.require('helpers/blocks/' + name + '/' + name + '.js');

            var ctx = helper.apply(this, arguments),
                template = handlebars.template(tmplSpec);

            return new handlebars.SafeString(template(ctx));
        });
    });
}

env.onceConfigured('handlebars', function(handlebars) {
    registerHelperBlocks(handlebars);
});
