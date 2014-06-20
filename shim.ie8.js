/**
 * Заглушки для IE8.
 * На основе https://github.com/es-shims/es5-shim .
 */

(function() {

    var objectProto = Object.prototype;
    var arrayProto = Array.prototype;
    var functionProto = Function.prototype;
    var stringProto = String.prototype;

    var object_hasOwnProperty = objectProto.hasOwnProperty;
    var object_toString = objectProto.toString;
    var array_slice = arrayProto.slice;

    function isArray(obj) {
        return object_toString.call(obj) == '[object Array]';
    }

    function isString(obj) {
        return object_toString.call(obj) == '[object String]';
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
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
     */
    if (!Object.create) {
        var createEmpty = function() {
            var iframe = document.createElement('iframe');
            var container = document.body || document.documentElement;

            iframe.style.display = 'none';
            container.appendChild(iframe);
            iframe.src = 'javascript:';

            var empty = iframe.contentWindow.Object.prototype;

            container.removeChild(iframe);
            iframe = null;
            container = null;

            delete empty.constructor;
            delete empty.isPrototypeOf;
            delete empty.hasOwnProperty;
            delete empty.propertyIsEnumerable;
            delete empty.valueOf;
            delete empty.toString;
            delete empty.toLocaleString;

            function Empty() {}

            Empty.prototype = empty;

            createEmpty = function () {
                return new Empty();
            };

            return new Empty();
        };

        Object.create = function(proto, props) {
            if (arguments.length >= 2) {
                if (props === null) {
                    throw new TypeError('props is not a non-null object');
                } else if (props !== undefined) {
                    throw new TypeError('Second argument not supported');
                }
            }

            if (proto === null) {
                return createEmpty();
            }

            if (proto != Object(proto)) {
                throw new TypeError(proto + ' is not an object or null');
            }

            function F() {}
            F.prototype = proto;

            return new F();
        };
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
