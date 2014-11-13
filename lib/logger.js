/**
 * @module logger
 *
 * @description
 * Инициализация логгеров приложения.
 * Чтобы в дальнейшем использовать логгер, достаточно только подключить сам winston:
 * ```js
 * var winston = require('winston');
 * ```
 */

var winston = require('winston'),
    config = require('../config'),
    conf = config.group('logger'),
    confGraylog = conf.graylog,
    confLogstash = conf.logstash;

var configured = false;

if (!configured) {
    var Graylog2 = require('winston-graylog2').Graylog2;

    // Настроить дефолтный логгер для проекта
    winston.add(winston.transports.File, conf.app);
    winston.remove(winston.transports.Console);
    if (typeof DEBUG == 'undefined' || DEBUG) {
        winston.add(winston.transports.Console, {colorize: true});
    }

    try {
        winston.add(Graylog2, confGraylog);
        winston.add(Graylog2, confLogstash);
    } catch (ex) {
        // pass
    }


    // Логирование ликов
    winston.loggers.add('leaks', conf.leaks);
    winston.loggers.get('leaks').remove(winston.transports.Console);

    // Логирование ошибок на клиенте
    winston.loggers.add('client', {
        transports: [new Graylog2(confGraylog), new Graylog2(confLogstash)]
    });
    if (typeof DEBUG == 'undefined' || DEBUG) {
        winston.loggers.get('client').add(winston.transports.Console, {colorize: true});
    }

    configured = true;
}


module.exports = winston;
