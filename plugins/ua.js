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
     * @private
     * @returns {boolean}
     */
    function museum(ua) { // @TODO вынести в конфиг
        var browser = ua.browser,
            os = ua.os;

        return (browser.name == 'Chrome' && browser.major < 21) ||
            (browser.name == 'IE' && browser.major < 9) ||
            (browser.name == 'Firefox' && browser.major < 29) ||
            (browser.name == 'Mozilla') ||
            (os.name == 'Windows' && os.version == '95') || // Если поставит нормальный браузер? Вы издеваетесь?
            (browser.name == 'Opera' && browser.major < 12) ||
            (browser.name == 'Opera Mini') ||
            (browser.name == 'Safari' && os.name == 'Android' && browser.major < 4 && parseInt(os.version, 10) < 4) ||
            (browser.name == 'Mobile Safari' && os.name == 'Android' && parseInt(os.version, 10) < 4) ||
            (browser.name == 'Safari' && os.name == 'Android' && parseInt(os.version, 10) < 4) ||
            (os.name == 'iOS' && browser.major < 7) ||
            (os.name == 'Mac OS X' && browser.name == 'Safari' && browser.major < 6) || // Олдовая сафари
            (os.name == 'Windows' && browser.name == 'Safari');
    }

    /**
     * @returns {Object} Объект, по которому можно определить браузер и операционку.
     */
    return function(userAgentString) {
        // Выставляем версию браузера.
        var parser = new UAParser();

        userAgentString = userAgentString || this.registry('ua').ua || '';
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
            isMuseum: museum(result),
            isDesktop: isDesktop,
            isPhone: isPhone,
            isTablet: isTablet,
            isMobile: isMobile,
            isIE: isIE,
            osName: osName
        });

        return result;
    };
};
