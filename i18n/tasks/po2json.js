module.exports = function(pot) {
    return function() {
        return pot.recipes.po2json.compile({
            debug: pot.args['i18n-debug']
        });
    };
};