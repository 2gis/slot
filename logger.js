/**
 * Файл инициализации логгеров приложения.
 *
 * Чтобы в дальнейшем использовать логгер, достаточно только подключить сам winston:
 *
 * var winston = require('winston');
 */

var winston = require('winston'),
    config = require('./config'),
    conf = require('./config').group('logger'),
    confGraylog = conf.graylog;

confGraylog.graylogHostname = config.innerhost;

var configured = false;

if (!configured) {
    var graylog2 = require('winston-graylog2').Graylog2;

    // Настроить дефолтный логгер для проекта
    winston.add(winston.transports.File, conf.app);
    winston.remove(winston.transports.Console);
    if (typeof DEBUG == 'undefined' || DEBUG) {
        winston.add(winston.transports.Console, {colorize: true});
    } else {
        try {
            winston.add(graylog2, confGraylog);
        } catch (ex) {
            // pass
        }
    }

    // Логирование ликов
    winston.loggers.add('leaks', conf.leaks);
    winston.loggers.get('leaks').remove(winston.transports.Console);

    // Логирование ошибок на клиенте
    winston.loggers.add('client', {
        transports: [new (graylog2)(confGraylog)]
    });
    if (typeof DEBUG == 'undefined' || DEBUG) {
        winston.loggers.get('client').add(winston.transports.Console, {colorize: true});
    }

    configured = true;
}


module.exports = winston;