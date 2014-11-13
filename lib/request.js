
/**
 * Jsonp requests on client
 * normal http requests on server
 * @TODO: what about normal ajax requests on client ?
 *
 */

var _ = require('lodash');

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
function serverRequest(conf) {
    var request = require('request'),
        winston = require('./logger'),
        config = require('../config');

    if (conf.method && conf.method.toLowerCase() == 'post') {
        conf.form = conf.data;
    } else {
        conf.qs = conf.data;
    }

    _.defaults(conf, {
        headers: {
            referer: config['server.referer']
        },
        success: _.noop,
        error: _.noop,
        complete: _.noop,
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


if (typeof window != 'undefined') {
    window.TestHandles = window.TestHandles || {};
    window.TestHandles.XHRActiveCount = 0;
}


function clientRequest(conf) {
    var reqwest = require('reqwest');
    // @doclink: https://github.com/ded/reqwest

    _.defaults(conf, {
        success: _.noop,
        error: _.noop,
        complete: _.noop
    });

    if (conf.type == 'json') {
        conf.crossOrigin = true;
    }

    var xhr = reqwest(conf).always(function() {
        window.TestHandles.XHRActiveCount--;
    });
    window.TestHandles.XHRActiveCount++;

    // во время аборта запроса не логируем его как ошибку
    var abort = xhr.abort;
    xhr.abort = function() {
        conf.error = _.noop;
        abort.call(xhr);
    };

    return xhr;
}
