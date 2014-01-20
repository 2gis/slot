var assert = require('assert');

describe('Core -> i18n', function() {
    var i18n = require('../i18n.js');

    it('_g (переводы)', function() {
        var str = i18n._g('dsvjsfvASDF42');

        assert.equal(str, 'dsvjsfvASDF42');
    });

    it('_t (окончания для разных чисел)', function() {
        var str = i18n._t(1, 'a', 'b', 'c'),
            i;

        assert.equal(str, '1 a');
        str = i18n._t(2, 'a', 'b', 'c');
        assert.equal(str, '2 b');
        for (i = 5 ; i < 20 ; i++) {
            str = i18n._t(i, 'a', 'b', 'c');
            assert.equal(str, i + ' c');
        }
        for (i = 1105 ; i < 1120 ; i++) {
            str = i18n._t(i, 'a', 'b', 'c');
            assert.equal(str, i + ' c');
        }
        
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