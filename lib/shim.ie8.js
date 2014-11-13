/**
 * Заглушки для IE8.
 * На основе https://github.com/es-shims/es5-shim .
 */

(function() {

    var objectProto = Object.prototype;
    var arrayProto = Array.prototype;
    var stringProto = String.prototype;

    var _toString = objectProto.toString;

    function isArray(obj) {
        return _toString.call(obj) == '[object Array]';
    }

    function isString(obj) {
        return _toString.call(obj) == '[object String]';
    }

    /**
     * http://wiki.ecmascript.org/doku.php?id=harmony:number.tointeger
     */
    function toInteger(num) {
        num = Number(num);

        if (isNaN(num)) {
            return 0;
        }
        if (num != 0 && isFinite(num)) {
            return (num < 0 ? -1 : 1) * Math.floor(Math.abs(num));
        }
        return num;
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
     */
    if (!Array.isArray) {
        Array.isArray = isArray;
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
     */
    if (!arrayProto.indexOf) {
        arrayProto.indexOf = function(searchElement, fromIndex) {
            var obj = isString(this) ? this.split('') : Object(this);
            var l = obj.length >>> 0;

            if (l == 0) {
                return -1;
            }

            fromIndex = arguments.length >= 2 ? toInteger(fromIndex) : 0;

            for (var i = fromIndex >= 0 ? fromIndex : Math.max(0, l + fromIndex); i < l; i++) {
                if (i in obj && obj[i] === searchElement) {
                    return i;
                }
            }
            return -1;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
     */
    if (!Date.now) {
        Date.now = function() {
            return new Date().getTime();
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
     */
    if (!stringProto.trim) {
        stringProto.trim = function() {
            if (this == null) {
                throw new TypeError('Can\'t convert ' + this + ' to object');
            }
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }

})();
