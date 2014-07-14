var config = require('slot/config');

/**
 * Дебажная информация.
 *
 * (!) Не занимать: (браузерные горячие клавиши)
 * Alt + D: Выделить адресную строку браузера
 *
 * Используемые сочетания:
 * Alt + A: вывести урлы апи в консоль
 */
exports.init = function() {
    $(document.body).on('keydown', function(e) {
        var key = e.charCode || e.keyCode;

        // Alt + A: урлы апи
        if (e.altKey && key == 65) {
            console.info(config['FlampApi.url']);
            console.info(config['WebApi.catalogUrl']);
            console.info(config['authApi.url']);
            console.info(config['feedbackApi.url']);
            console.info(config['p2dApi.url']);
            console.info(config['pages.url']);
            console.info(config['plusone.libURL']);
            console.info(config['shortonizerApi.url']);
            console.info(config['suggestUrl']);
        }
    });
};