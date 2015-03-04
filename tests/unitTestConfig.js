
global.DEBUG = false;

var env = require('../env');
env.setBuildPath('./tests/build/');
env.set('handlebars', require('handlebars'));
