var baseAppConstructor = require('./app');

module.exports = function(params) {

    var baseApp = baseAppConstructor({
        rootPath: params.rootPath + '/'
    });

    return baseApp.instance;
};