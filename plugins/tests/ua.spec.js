var assert = require('assert');

describe('plugins.ua', function() {
    it('Определение Яндекс.Браузера 1.7', function() {
        var ua = require('../ua.js')();
        var yandexUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 YaBrowser/1.7.1364.17132 Safari/537.22";
        var result = ua(yandexUA);
        assert.equal(result.browser.name, 'Yandex', 'Имя браузера должно определиться как "Yandex"');
        assert.equal(result.browser.major, 1, 'Мажорная версия браузера должна быть равна 1');
    });
});
