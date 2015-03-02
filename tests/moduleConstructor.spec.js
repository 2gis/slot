
var Constructor = require('../moduleConstructor'),
    _ = require('lodash'),
    assert = require('chai').assert;

var appMock = {
    getModuleDescriptorById: function() {
        return {};
    }
};
var slotMock = {
    templates: {},
    kill: _.noop,
    remove: _.noop,
    dispose: _.noop
};
var handlebarsMock = {};

describe("moduleConstructor", function() {
    describe('render', function() {
        it('Формирование классов', function() {
            var moduleConf = {
                type: 'callout'
            };
            var expected = '<div id="module-undefined" data-module="callout" class="callout"></div>';

            var html = Constructor(appMock, moduleConf, slotMock, handlebarsMock).render();

            assert.equal(html, expected, 'Должен быть вот такой html');
        });
    });
});