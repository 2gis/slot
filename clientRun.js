if (typeof SKIP_APP_RUN == 'undefined') {
    var bootstrap = require('./core/clientBootstrap.js');
    bootstrap.run();
}