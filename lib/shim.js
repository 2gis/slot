/**
 * Заглушки.
 */

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Window.setImmediate
 */
require('setimmediate');

(function() {

    var stringProto = String.prototype;

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
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
     */
    if (!Object.isExtensible) {
        Object.isExtensible = function(obj) {
            return false;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions
     */
    if (!Object.preventExtensions) {
        Object.preventExtensions = function(obj) {
            return obj;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
     */
    if (!Object.isSealed) {
        Object.isSealed = function(obj) {
            return false;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
     */
    if (!Object.seal) {
        Object.seal = function(obj) {
            return obj;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
     */
    if (!Object.isFrozen) {
        Object.isFrozen = function(obj) {
            return false;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
     */
    if (!Object.freeze) {
        Object.freeze = function(obj) {
            return obj;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     */
    if (typeof Object.assign != 'function') {
        Object.assign = function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains
     */
    if (!stringProto.contains) {
        stringProto.contains = function(searchString, position) {
            if (this == null) {
                throw new TypeError('Can\'t convert ' + this + ' to object');
            }

            return String.prototype.indexOf.apply(this, arguments) > -1;
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
     */
    if (!stringProto.startsWith) {
        stringProto.startsWith = function(searchString, position) {
            if (this == null) {
                throw new TypeError('Can\'t convert ' + this + ' to object');
            }

            searchString = String(searchString);
            position = arguments.length >= 2 ? toInteger(position) : 0;

            var str = String(this);
            var startPos = Math.min(Math.max(position, 0), str.length);

            return searchString == str.slice(startPos, startPos + searchString.length);
        };
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
     */
    if (!stringProto.endsWith) {
        stringProto.endsWith = function(searchString, position) {
            if (this == null) {
                throw new TypeError('Can\'t convert ' + this + ' to object');
            }

            searchString = String(searchString);

            var str = String(this);
            var strLength = str.length;

            position = arguments.length >= 2 ? toInteger(position) : strLength;

            var endPos = Math.min(Math.max(position, 0), strLength);

            return searchString == str.substring(endPos - searchString.length, endPos);
        };
    }

    var noop = function() {};

    if (typeof console == "undefined") {
        var consoleWrapper = {
            group: noop,
            groupCollapsed: noop,
            groupEnd: noop,
            log: noop,
            warn: noop,
            info: noop,
            error: noop
        };

        window.console = consoleWrapper;
    } else if (!console.group || !console.groupCollapsed) {
        console.group = console.groupCollapsed = function() {
            Function.prototype.apply.call(console.log, console, arguments);
        };
        console.groupEnd = noop;
    }

    if (!console.groupCollapsed) {
        console.groupCollapsed = console.group;
    }

})();
