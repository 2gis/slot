
/**
 * Jsonp requests on client
 * normal http requests on server
 * @TODO: what about normal ajax requests on client ?
 *
 */

var _ = require('underscore');

module.exports = typeof window == 'undefined' ? serverRequest : clientRequest;

/**
 * Враппер для jQuery.ajax и request с более менее общим апи
 *
 * Из параметров ниже, xhr и errorDesc зависит от среды исполнения
 *
 * Общие поддерживаемые опции
 * @param conf.url - урл запроса
 * @param conf.type - тип запроса (на сервере поддерживается только json)
 * @param conf.data - параметры запроса
 * @param conf.success(body, xhr)
 * @param conf.error(xhr, reason)
 * @param conf.complete(error, body|reason, xhr)
 * @param conf.timeout in milliseconds
 * @returns {*}
 */

function noop() {}


function serverRequest(conf) {
    // Browserify хак, специально имя пакето вынесено в переменную
    var pkg = 'request';
    var request = require(pkg),
        loggerModule = './logger', // move module name to separate value to avoid browserify include on client    
        winston = require(loggerModule),
        config = require('./config');

    if (conf.method && conf.method.toLowerCase() == 'post') {
        conf.form = conf.data;
    } else {
        conf.qs = conf.data;
    }

    _.defaults(conf, {
        headers: {
            referer: config['server.referer']
        },
        success: noop,
        error: noop,
        complete: noop,
        pool: false
    });

    // @doclink: https://github.com/mikeal/request#requestoptions-callback
    return request(conf, function(error, xhr, body) {
        if (error) {
            conf.error.call(conf.context, xhr, error);
            winston.error("Couldn't do request", {url: conf.url, params: conf, statusCode: xhr && xhr.statusCode, error: error + ''});
        } else {
            try {
                body = conf.type.match(/^json/) ? JSON.parse(body) : body;
                conf.success.call(conf.context, body, xhr);
            } catch (ex) {
                if (ex instanceof SyntaxError) {
                    var err = new SyntaxError("[request] couldn't parse response as JSON (from " + conf.url + "): " + body);
                    conf.error.call(conf.context, xhr, err);
                } else {
                    throw ex;
                }
            }
        }
        conf.complete.call(conf.context, error, body, xhr);
    });
}

function clientRequest(conf) {
    var reqwest = require('reqwest'),
        sendError = req('lib/sendError');
    // @doclink: https://github.com/ded/reqwest

    _.defaults(conf, {
        success: noop,
        error: noop,
        complete: noop
    });

    var errorCallback = conf.error;
    conf.error = function(xhr, error) {
        if (conf.url != '/log') { //do not allow loops
            var sendErrorData = {
                requestParams: conf,
                responseCode: xhr && xhr.statusCode,
                error: error,
                xhr: xhr,
                userAgent: navigator.userAgent,
                url: document.location.toString()
            };
            sendError('AJAX request error - ' + conf.url, sendErrorData);
        }
        errorCallback(xhr, error);
    };

    if (conf.type == 'json') {
        conf.crossOrigin = true;
    }

    return reqwest(conf);
}