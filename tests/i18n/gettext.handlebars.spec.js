
var assert = require('assert');

describe('i18n _ht хелперы', function() {
    var testEnv = require('../../../testEnv')(),
        $i18n = require('../i18n')(testEnv.app);

    it('_ht корретно работает с интерполяцией и блок-хелперами', function() {
        var r1 = $i18n._ht('Открыть %1 на %{Link странице}', 'результаты поиска', {
            link: {
                href: 'http://2gis.ru'
            }
        });

        assert.equal(r1, 'Открыть результаты поиска на <a href="http://2gis.ru" class="link ">странице</a>');
    });

    it('_hnt корретно работает с интерполяцией и блок-хелперами', function() {
        var r1 = $i18n._hnt(
                'Открыть %2 на %1 %{Link странице}',
                'Открыть %2 на %1 %{Link страницах}',
                'Открыть %2 на %1 %{Link страницах}',
                5,
                'результаты поиска', {
            link: {
                href: 'http://2gis.ru'
            }
        });

        assert.equal(r1, 'Открыть результаты поиска на 5 <a href="http://2gis.ru" class="link ">страницах</a>');
    });


    it('_ht корретно работает с анонимными блоками', function() {
        var r = $i18n._ht('Ссылка на %{cap капчу}', {
            cap: function(text) {
                return '<s>' + text + '</s>';
            }
        });

        assert.equal(r, 'Ссылка на <s>капчу</s>');
    });
});