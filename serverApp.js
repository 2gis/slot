var baseAppConstructor = require('./app');

module.exports = function(params) {

    var baseApp = baseAppConstructor({
        rootPath: params.rootPath + '/'
    });

    var app = baseApp.instance;
    app.wasRendered = false;

    return app;
};