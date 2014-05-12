var assert = require('assert');

describe('Core -> i18n', function() {
    var i18n = require('../i18n.js');

    it('_g (переводы)', function() {
        var str = i18n._g('dsvjsfvASDF42');

        assert.equal(str, 'dsvjsfvASDF42');
    });

    it('_gu (первая буква - заглавная)', function() {
        assert.equal(i18n._gu(1), 1);
        assert.equal(i18n._gu(''), '');
        assert.equal(i18n._gu(), undefined);
        assert.equal(i18n._gu(null), null);
        assert.equal(i18n._gu('строка'), 'Строка');
        assert.equal(i18n._gu('Строка'), 'Строка');
    });

});