var assert = require('assert');
var Application = require('../../app');
var _ = require('lodash');

describe('plugins.ua', function() {
    describe('userAgentFlags', function() {
        function getApp(config) {
            var app = new Application();
            app.config = _.extend(app.config, config);
            return app;
        }

        var app;
        var ua;
        var yandexUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 YaBrowser/1.7.1364.17132 Safari/537.22';

        it('Имя и версия браузера (<)', function() {
            app = getApp({
                'userAgentFlags.isOldYandex': [{ name: 'Yandex', major: '<2' }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isOldYandex, true, 'Флаг isOldYandex должен выставиться в true');
        });

        it('Имя и версия операционки (=)', function() {
            app = getApp({
                'userAgentFlags.isMacOS10': [{ os: { name: 'Mac OS X', version: '=10' } }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isMacOS10, true, 'Флаг isMacOS10 должен выставиться в true');

            app = getApp({
                'userAgentFlags.isMacOS11': [{ os: { name: 'Mac OS X', version: '=11' } }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isMacOS11, false, 'Флаг isMacOS11 должен выставиться в false');

        });

        it('Браузер и операционка одновременно (только имя)', function() {
            app = getApp({
                'userAgentFlags.isNice': [{ name: 'Yandex', os: { name: 'Mac OS X' } }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isNice, true, 'Флаг isNice должен выставиться в true');

            app = getApp({
                'userAgentFlags.isNice': [{ name: 'Yandex', os: { name: 'Max OB Y' } }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isNice, false, 'Флаг isNice должен выставиться в false');
        });

        it('Несколько правил для одного флага', function() {
            app = getApp({
                'userAgentFlags.isNice': [
                    { name: 'Yandex', os: { name: 'Mac OS X' } },
                    { name: 'Google', os: { name: 'Solaris' } }
                ]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isNice, true, 'Флаг isNice должен выставиться в true');
        });

        it('Несколько флагов одновременно', function() {
            app = getApp({
                'userAgentFlags.isNiceOS': [{ os: { name: 'Mac OS X' } }],
                'userAgentFlags.isNiceBrowser': [{ name: 'Chrome' }]
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isNiceOS, true, 'Флаг isNiceOS должен выставиться в true');
            assert.equal(ua.isNiceBrowser, false, 'Флаг isNiceBrowser должен выставиться в false');
        });

        it('Условие — функция', function() {
            app = getApp({
                'userAgentFlags.isNiceOS': function(ua) {
                    return ~ua.ua.indexOf('Macintosh; Intel Mac OS X 10_8_4');
                },
                'userAgentFlags.isBadOS': function(ua) {
                    return ua.os.name == 'Windows';
                }
            });
            ua = app.ua(yandexUA);

            assert.equal(ua.isNiceOS, true, 'Флаг isNiceOS должен выставиться в true');
            assert.equal(ua.isBadOS, false, 'Флаг isBadOS должен выставиться в false');
        });
    });
});
