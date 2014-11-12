
var baseAppConstructor = require('./app');

/**
 * @class slot.ServerApp
 * @extends {slot.App}
 */
module.exports = function(params) {
    var baseApp = baseAppConstructor({
        rootPath: params.rootPath + '/'
    });

    return baseApp.instance;
};
