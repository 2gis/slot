var _ = require('lodash');
var UAParser = require('ua-parser-js');

module.exports = function(app) {
    /**
     * На основе http://matthewhudson.me/projects/device.js/ .
     */

    /**
     * @param {string} userAgent
     * @returns {string}
     */
    function getPlatform(userAgent) {
        userAgent = userAgent.toLowerCase();

        function find(needle) {
            return userAgent.indexOf(needle) > -1;
        }

        var iPhone = find('iphone');
        var iPod = find('ipod');
        var iPad = find('ipad');
        var android = find('android');
        var androidPhone = android && find('mobile');
        var androidTablet = android && !androidPhone;
        var windows = find('windows');
        var windowsPhone = windows && find('phone');
        var windowsTablet = windows && !windowsPhone && find('touch');
        var blackberry = find('blackberry') || find('bb10') || find('rim');
        var blackberryPhone = blackberry && !find('tablet');
        var blackberryTablet = blackberry && !blackberryPhone;
        var tizen = find('tizen');
        var tizenPhone = tizen && find('mobile');
        var tizenTablet = tizen && !tizenPhone;
        var fxOS = (find('(mobile;') || find('(tablet;')) && find('; rv:');
        var fxOSPhone = fxOS && find('mobile');
        var fxOSTablet = fxOS && find('tablet');
        var meeGo = find('meego');

        if (iPhone || iPod || androidPhone || windowsPhone || blackberryPhone || tizenPhone || fxOSPhone || meeGo) {
            return 'phone';
        }
        if (iPad || androidTablet || windowsTablet || blackberryTablet || tizenTablet || fxOSTablet) {
            return 'tablet';
        }
        return 'desktop';
    }
    /**
     * Проверяет, матчится ли версия браузера/операционки на правило из конфига
     * @param  {String} configVersion      - значение из конфига
     * @param  {Number|String} realVersion - реальная версия
     * @return {Boolean}                   - true, если версия подходит под правило
     *
     * @example
     * // returns true
     * matchVersion('<10', 9);
     *
     * @example
     * // returns false
     * matchVersion('=10', 20);
     *
     * @example
     * // return true
     * matchVersion('<11', '10.8.4');
     */
    function matchVersion(configVersion, realVersion) {
        if (typeof realVersion == 'string') {
            realVersion = parseInt(realVersion, 10);
        }
        var sign = configVersion[0];
        if (_.contains(['<', '=', '>'], sign)) {
            configVersion = parseInt(configVersion.slice(1), 10);
        } else {
            sign = '=';
        }

        switch (sign) {
            case '<':
                return realVersion < configVersion;
            case '>':
                return realVersion > configVersion;
            default:
                return realVersion == configVersion;
        }
    }

    /**
     * Проверяет, подходит ли user-agent под правило из конфига
     * @param  {Object} configUa - значение из конфига
     * @param  {Object} realUa   - реальный юзер-агент
     * @return {Boolean}
     */
    function matchUA(configUa, realUa) {
        var configBrowser = configUa;
        var realBrowser = realUa.browser || {};
        var configOs = configUa.os || {};
        var realOs = realUa.os || {};

        if (configBrowser.name) {
            if (configBrowser.name != realBrowser.name) return;
        }
        if (configOs.name) {
            if (configOs.name != realOs.name) return;
        }
        if (configBrowser.major) {
            if (!matchVersion(configBrowser.major, realBrowser.major)) return;
        }
        if (configOs.version) {
            if (!matchVersion(configOs.version, realOs.version)) return;
        }

        return true;
    }

    /**
     * Возвращает флаги и их значения, вычисленные по правилам из конфига
     * @param  {Object} ua
     * @return {Object}
     */
    function getFlags(ua) {
        var flagList = app.config.group('userAgentFlags');

        return _.mapValues(flagList, function(condition) {
            if (_.isArray(condition)) {
                return !!_.find(condition, function(rule) {
                    return matchUA(rule, ua);
                });
            }

            if (_.isFunction(condition)) {
                return !!condition(ua);
            }

            return !!condition;
        });
    }

    function getUAFromRegistry() {
        return app.registry.has('ua') ? app.registry.get('ua').ua : '';
    }

    /**
     * @returns {Object} Объект, по которому можно определить браузер и операционку.
     */
    function getUA(userAgentString) {
        // Выставляем версию браузера.
        var parser = new UAParser();

        userAgentString = userAgentString || getUAFromRegistry() || '';
        parser.setUA(userAgentString);

        var result = parser.getResult();
        var osName = (result.os && result.os.name || '').toLowerCase().replace(/ /g, '');

        var platform = getPlatform(userAgentString);
        var isDesktop = platform == 'desktop';
        var isPhone = platform == 'phone';
        var isTablet = platform == 'tablet';
        var isMobile = isPhone || isTablet;

        // Если мы в ИЕ, то этот флаг становится функцией, который возвращает соответствие версии ИЕ
        var isIE = function(version) {
            return result.browser.name == 'IE' && (version ? version == result.browser.major : true);
        };

        _.extend(result, {
            isDesktop: isDesktop,
            isPhone: isPhone,
            isTablet: isTablet,
            isMobile: isMobile,
            isIE: isIE,
            osName: osName
        }, getFlags(result));

        return result;
    }

    var cache = {};

    return function(userAgentString) {
        if (!cache[userAgentString]) {
            cache[userAgentString] = getUA(userAgentString);
        }
        return cache[userAgentString];
    };
};
