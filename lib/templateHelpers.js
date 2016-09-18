/**
 * @module templateHelpers
 */

var _ = require('lodash');
var templateProvider = require('./templateProvider');
var stuff = require('./stuff');
var uaConditional = require('./uaConditional');

/**
 * Регистрирует хэлперблоки
 *
 * Должны лежать в проекте по пути helpers/blocks/
 * @param handlebars
 */
function registerHelperBlocks(handlebars, __helpers) {
    var helpers = templateProvider.getStorage('helpers');

    _.each(helpers, function(tmplSpec, name) {
        handlebars.registerHelper(stuff.capitalize(name), function() {
            var helper = __helpers[name];

            var ctx = helper.apply(this, arguments),
                template = typeof tmplSpec == 'function' ?
                    handlebars.template({compiler: [7,'>= 4.0.0'], main: tmplSpec}) : // old format
                    handlebars.template(tmplSpec);

            return new handlebars.SafeString(template(ctx));
        });
    });
}

function registerHelpers(app) {
    /**
     * Условный оператор для браузера
     * Принимает строку вида 'IE8', 'IE<=10', 'Opera > 12', 'Firefox 35', 'Chrome' и т.д.
     *
     * @example
     * {{#browser 'Safari'}} Safari {{else}} Other browser {{/browser}}
     *
     * @returns {string}
     */
    var browser = function(conditional, options) {
        var ua = app.ua();

        if (uaConditional(conditional, ua && ua.browser)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    };
    app.handlebars.registerHelper('browser', browser);

    registerHelperBlocks(app.handlebars, app.__helpers || app.app.__helpers);
}

module.exports = registerHelpers;
