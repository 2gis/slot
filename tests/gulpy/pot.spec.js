
var assert = require('assert');

var Pot = require('../../gulpy/pot');

describe("Горшочек", function() {
    describe("modulesFilter", function() {
        var pot;

        before(function() {
            pot = Pot({});

            pot.projectRequire = function() {
                return {};
            };

            pot.flags = {};
            pot.projectPath = '/';
            delete pot.config;
        });

        it('Нет в blackList и whiteList', function() {
            pot.config = {
                blackListModules: []
            };

            var forBuild = pot.modulesFilter('firmCard/firmCard.js');

            assert(forBuild, 'По дефолту все модули должны уходить в сборку');
        });

        it('Есть в blackList нет в whiteList', function() {
            pot.config = {
                blackListModules: ['firm', 'firmCard']
            };

            var forBuild = pot.modulesFilter('firmCard/firmCard.js');

            assert(!forBuild, 'Если модуль в blackList, он не должен попадать в сборку ни при каких обстоятельствах');
        });

        it('Есть blackList и whiteList', function() {
            pot.config = {
                whiteListModules: ['firmCard', 'geoCard'],
                blackListModules: ['firmCard', 'geoCard']
            };

            var forBuild = pot.modulesFilter('firmCard/firmCard.js');

            assert(!forBuild, 'Если модуль в blackList, он не должен попадать в сборку ни при каких обстоятельствах');
        });

        it('Есть whiteList, но модуля в нём нет', function() {
            pot.config = {
                whiteListModules: ['geoCard']
            };

            var forBuild = pot.modulesFilter('firmCard/firmCard.js');

            assert(!forBuild, 'Если есть whiteList, но модуль не в нём, он не должен попадать в сборку');
        });

        it('blackList is undefined (проверяем _.contains(undefined, arg))', function() {
            pot.config = {
                blackListModules: undefined
            };

            var forBuild = pot.modulesFilter('firmCard/firmCard.js');

            assert(forBuild, 'Если blackList undefined, модуль должен попасть в сборку');
        });
    });
});