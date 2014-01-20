var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    handlebars = require('handlebars'),
    _ = require('underscore'),
    helpers = require('./templateHelpers'),
    baseAppConstructor = require('./app'),
    utils = require('./utils');

helpers.registerHelpers(handlebars);

module.exports = function(params) {

    var baseApp = baseAppConstructor({
        rootPath: params.rootPath + '/'
    });

    var app = baseApp.instance;

    _.extend(app, {

        wasRendered: false
    });

    return app;
};