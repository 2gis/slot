
var assert = require('assert');

describe('i18n', function() {
    var testEnv = require('../../../testEnv')(),
        $i18n = require('../i18n')(testEnv.app);

    describe('Метод _config', function() {
        it('Возвращает ссылку на нужный регион', function() {
            $i18n.mock({
                countryCode: 'RU',
                config: {
                    testLink: {
                        'ru': 'http://2gis.ru',
                        'en': 'http://2gis.com'
                    }
                }
            });

            var result = $i18n._config('testLink');

            assert.equal(result, 'http://2gis.ru');

            $i18n.mock({
                countryCode: 'EN',
                config: {
                    testLink: {
                        'ru': 'http://2gis.ru',
                        'en': 'http://2gis.com'
                    }
                }
            });

            result = $i18n._config('testLink');

            assert.equal(result, 'http://2gis.com');
        });

        it('Возвращает ссылку на ru-регион, если в конфиге нет ссылки на countryCode-регион', function() {
            $i18n.mock({
                countryCode: 'EN',
                config: {
                    testLink: {
                        'ru': 'http://2gis.ru'
                    }
                }
            });

            var result = $i18n._config('testLink');

            assert.equal(result, 'http://2gis.ru');
        });

        it('Бросает исключение, если в конфиге нет ключа', function() {
            $i18n.mock({
                countryCode: 'EN',
                config: {}
            });

            var result = $i18n._config('testLink');

            assert.equal(result, '', 'При отсутствии конфига, должен вернуть пустую строку (обработка ошибок на другом уровне должна быть)');
        });

        it('Возвращает ссылку на указанный вторым аргументом регион', function() {
            $i18n.mock({
                countryCode: 'EN',
                config: {
                    testLink: {
                        'en': 'http://2gis.com',
                        'ua': 'http://2gis.ua'
                    }
                }
            });

            var result = $i18n._config('testLink', 'ua');

            assert.equal(result, 'http://2gis.ua', 'Должен вернуть именно ua версию, а не для текущего региона en');
        });

        it('Возвращает ссылку на локальный регион, даже если вторым аргументом другой регион, но нет значения', function() {
            $i18n.mock({
                countryCode: 'EN',
                config: {
                    testLink: {
                        'en': 'http://2gis.com',
                        'ua': 'http://2gis.ua'
                    }
                }
            });

            var result = $i18n._config('testLink', 'kz');

            assert.equal(result, 'http://2gis.com', 'Должен вернуть именно com версию, потому что по kz нет значения');
        });
    });
});