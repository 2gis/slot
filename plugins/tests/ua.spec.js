var assert = require('assert');
var Application = require('../../app');

describe('plugins.ua', function() {
    describe('isMuseum', function() {
        function getApp(museum) {
            var app = new Application();
            app.config['museum.list'] = museum;
            return app;
        }

        var app;
        var ua;
        var yandexUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.172 YaBrowser/1.7.1364.17132 Safari/537.22';

        it('Пустой конфиг', function() {
            app = getApp(undefined);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, false, 'Флаг isMuseum должен выставиться в false');
        });
        it('Имя и версия браузера (<)', function() {
            app = getApp([
                { name: 'Yandex', major: '<2' }
            ]);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, true, 'Флаг isMuseum должен выставиться в true');
        });

        it('Имя и версия операционки (=)', function() {
            app = getApp([
                { os: { name: 'Mac OS X', version: '=10' } }
            ]);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, true, 'Флаг isMuseum должен выставиться в true');

            app = getApp([
                { os: { name: 'Mac OS X', version: '=11' } }
            ]);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, false, 'Флаг isMuseum должен выставиться в false');

        });

        it('Браузер и операционка одновременно (только имя)', function() {
            app = getApp([
                { name: 'Yandex', os: { name: 'Mac OS X' } }
            ]);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, true, 'Флаг isMuseum должен выставиться в true');

            app = getApp([
                { name: 'Yandex', os: { name: 'Max OB Y' } }
            ]);
            ua = app.ua(yandexUA);

            assert.equal(ua.isMuseum, false, 'Флаг isMuseum должен выставиться в false');
        });
    });
});
