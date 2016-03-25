/**
 * @module request
 *
 * @description Jsonp requests on client normal http requests on server.
 */
/*!
 * @TODO: what about normal ajax requests on client ?
 */

var _ = require('lodash');
var UAParser = require('ua-parser-js');

module.exports = typeof window == 'undefined' ? serverRequest : clientRequest;

/**
 * Враппер для jQuery.ajax и request с более менее общим апи.
 *
 * Из параметров ниже, `xhr` и `errorDesc` зависит от среды исполнения.
 *
 * @param {string} conf.url - Урл запроса.
 * @param {string} conf.type - Тип запроса (на сервере поддерживается только json).
 * @param {Object} conf.data - Параметры запроса.
 * @param {Boolean} conf.processData
 * @param {Function} [conf.success] - callback(body, xhr)
 * @param {Function} [conf.error] - callback(xhr, reason)
 * @param {Function} [conf.complete] - callback(error, result, xhr)
 * @param {int} conf.timeout - In milliseconds.
 * @returns {*}
 */
function serverRequest(conf) {
    var request = require('request');

    if (conf.method && conf.method.toLowerCase() != 'get') {
        if (conf.processData === false) {
            conf.body = conf.data;
        } else {
            conf.form = conf.data;
        }
    } else {
        conf.qs = conf.data;
    }

    _.defaults(conf, {
        success: _.noop,
        error: _.noop,
        complete: _.noop
    });

    // @doclink: https://github.com/mikeal/request#requestoptions-callback
    return request(conf, function(error, xhr, body) {
        if (error) {
            conf.error.call(conf.context, xhr, error);
        } else {
            try {
                if (body && conf.type.match(/^json/)) {
                    body = JSON.parse(body);
                }
                conf.success.call(conf.context, body, xhr);
            } catch (ex) {
                if (ex instanceof SyntaxError) {
                    var err = new SyntaxError(
                        "[request] couldn't parse response as JSON (from " + conf.url + "): " + body
                    );

                    conf.error.call(conf.context, xhr, err);
                } else {
                    throw ex;
                }
            }
        }

        conf.complete.call(conf.context, error, body, xhr);
    });
}


var isLegacyIECached = null;

function isLegacyIE() {
    if (isLegacyIECached == null) {
        var res = UAParser(navigator.userAgent);
        isLegacyIECached = res.browser.name == 'IE' && Number(res.browser.major) < 10;
    }
    return isLegacyIECached;
}

var originRe = /(?:https?:)?\/\/([^/:]+)/;

function isCrossOrigin(url) {
    var matched = url.match(originRe);
    if (matched) {
        return document.location.hostname != matched[1];
    }
}

function clientRequest(conf) {
    var reqwest = require('reqwest');
    // @doclink: https://github.com/ded/reqwest

    _.defaults(conf, {
        success: _.noop,
        error: _.noop,
        complete: _.noop,
        overrideType: _.noop
    });

    if (isCrossOrigin(conf.url)) {
        conf.crossOrigin = true;
    }

    // IE ниже 10 версии не поддерживают передачу кук в кросс-доменных сценариях
    if (conf.crossOrigin && conf.withCredentials && conf.type != 'jsonp' && isLegacyIE()) {
        conf.type = 'jsonp';
        conf.overrideType('jsonp');
    }

    var xhr = reqwest(conf);

    // во время аборта запроса не логируем его как ошибку
    var abort = xhr.abort;
    xhr.abort = function() {
        conf.error = _.noop;
        abort.call(xhr);
    };

    return xhr;
}
