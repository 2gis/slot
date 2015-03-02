var assert = require('assert');
var uaConditional = require('../uaConditional');

function getUA(browser, major) {
    return {
        name: browser,
        major: major || 1
    };
}

describe('uaConditional.', function() {

    // Browser name only
    describe('Browser name.', function() {
        // Simple name
        it('Simple name. Positive', function() {
            assert.ok(uaConditional('Chrome', getUA('Chrome')));
        });
        it('Simple name. Negative', function() {
            assert.ok(!uaConditional('Chrome', getUA('Firefox')));
        });

        // Small-case characters
        it('Small-case. Positive', function() {
            assert.ok(uaConditional('chrome', getUA('Chrome')));
        });
        it('Small-case. Negative', function() {
            assert.ok(!uaConditional('chrome', getUA('Firefox')));
        });

        // Space triming
        it('Space triming', function() {
            assert.ok(uaConditional('safari ', getUA('Safari')));
        });

        // With space
        it('With space', function() {
            assert.ok(uaConditional('Internet Explorer', getUA('Internet Explorer')));
        });
    });

    // Browser name + Major version
    describe('Name + Major', function() {
        // With space
        it('With space. Other browser', function() {
            assert.ok(!uaConditional('Firefox 29', getUA('Chrome')));
        });
        it('With space. 29 vs 29', function() {
            assert.ok(uaConditional('Firefox 29', getUA('Firefox', 29)));
        });
        it('With space. 29 vs 28', function() {
            assert.ok(!uaConditional('Firefox 29', getUA('Firefox', 28)));
        });
        it('With space. 29 vs 30', function() {
            assert.ok(!uaConditional('Firefox 29', getUA('Firefox', 30)));
        });

        // Without space
        it('Without space. 8 vs 8', function() {
            assert.ok(uaConditional('IE8', getUA('IE', 8)));
        });
        it('Without space. 8 vs 7', function() {
            assert.ok(!uaConditional('IE8', getUA('IE', 7)));
        });
        it('Without space. 8 vs 9', function() {
            assert.ok(!uaConditional('IE8', getUA('IE', 9)));
        });
    });

    // Less conditional
    describe('Less', function() {
        it('Opera < 12 (vs 11)', function() {
            assert.ok(uaConditional('Opera < 12', getUA('Opera', 11)));
        });
        it('Opera < 12 (vs 12)', function() {
            assert.ok(!uaConditional('Opera < 12', getUA('Opera', 12)));
        });
        it('Opera < 12 (vs 15)', function() {
            assert.ok(!uaConditional('Opera < 12', getUA('Opera', 15)));
        });
    });

    // Less or equal conditional
    describe('Less or equal', function() {
        it('Safari <= 8 (vs 7)', function() {
            assert.ok(uaConditional('Safari <= 8', getUA('Safari', 7)));
        });
        it('Safari <= 8 (vs 8)', function() {
            assert.ok(uaConditional('Safari <= 8', getUA('Safari', 8)));
        });
        it('Safari <= 8 (vs 9)', function() {
            assert.ok(!uaConditional('Safari <= 8', getUA('Safari', 9)));
        });
    });

    // More
    describe('More', function() {
        it('IE > 8 (vs 7)', function() {
            assert.ok(!uaConditional('IE > 8', getUA('IE', 7)));
        });
        it('IE > 8 (vs 8)', function() {
            assert.ok(!uaConditional('IE > 8', getUA('IE', 8)));
        });
        it('IE > 8 (vs 9)', function() {
            assert.ok(uaConditional('IE > 8', getUA('IE', 9)));
        });
    });

    // More or equal
    describe('More or equal', function() {
        it('Chrome >= 22 (vs 21)', function() {
            assert.ok(!uaConditional('Chrome >= 22', getUA('Chrome', 21)));
        });
        it('Chrome >= 22 (vs 22)', function() {
            assert.ok(uaConditional('Chrome >= 22', getUA('Chrome', 22)));
        });
        it('Chrome >= 22 (vs 23)', function() {
            assert.ok(uaConditional('Chrome >= 22', getUA('Chrome', 23)));
        });
    });

    // Not equal
    describe('Not equal', function() {
        it('Firefox != 20 (vs 19)', function() {
            assert.ok(uaConditional('Firefox != 20', getUA('Firefox', 19)));
        });
        it('Firefox != 20 (vs 20)', function() {
            assert.ok(!uaConditional('Firefox != 20', getUA('Firefox', 20)));
        });
        it('Firefox != 20 (vs 21)', function() {
            assert.ok(uaConditional('Firefox != 20', getUA('Firefox', 21)));
        });
    });

    // Equal
    describe('Equal', function() {
        it('Firefox = 20 (vs 19)', function() {
            assert.ok(!uaConditional('Firefox = 20', getUA('Firefox', 19)));
        });
        it('Firefox = 20 (vs 20)', function() {
            assert.ok(uaConditional('Firefox = 20', getUA('Firefox', 20)));
        });
        it('Firefox = 20 (vs 21)', function() {
            assert.ok(!uaConditional('Firefox = 20', getUA('Firefox', 21)));
        });
        it('Firefox == 20 (vs 20)', function() {
            assert.ok(uaConditional('Firefox == 20', getUA('Firefox', 20)));
        });
        it('Firefox === 20 (vs 20)', function() {
            assert.ok(uaConditional('Firefox === 20', getUA('Firefox', 20)));
        });
    });

    // Equal
    describe('Exceptions', function() {
        // Empty string
        it('Empty string', function() {
            assert.ok(!uaConditional('', getUA('Chrome')));
        });

        // Unvalid type
        it('Bool', function() {
            assert.ok(!uaConditional(true, getUA('Chrome')));
        });
        it('Object', function() {
            assert.ok(!uaConditional({}, getUA('Chrome')));
        });
        it('Number', function() {
            assert.ok(!uaConditional(666, getUA('Chrome')));
        });
        it('Function', function() {
            assert.ok(!uaConditional(function() {}, getUA('Chrome')));
        });

        // Fraction
        it('Fraction with dot', function() {
            assert.ok(uaConditional('Opera 12.15', getUA('Opera', 12)));
        });
        it('Fraction with colon', function() {
            assert.ok(uaConditional('Opera 12,15', getUA('Opera', 12)));
        });

        // Conditional without space
        it('IE<=8 (vs 7)', function() {
            assert.ok(uaConditional('IE<=8', getUA('IE', 7)));
        });
        it('IE<=8 (vs 8)', function() {
            assert.ok(uaConditional('IE<=8', getUA('IE', 8)));
        });
        it('IE<=8 (vs 9)', function() {
            assert.ok(!uaConditional('IE<=8', getUA('IE', 9)));
        });
    });

});
