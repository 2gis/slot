/**
 * Заглушки для браузера.
 */

(function() {

    /**
     * @private
     */
    function getClassNames(el) {
        return (el.className.baseVal !== undefined ? el.className.baseVal : el.className).toString().match(/\S+/g) || [];
    }

    /**
     * @private
     */
    function checkClassName(name) {
        if (name == '') {
            throw new Error('SyntaxError: An invalid or illegal string was specified');
        }
        if (/\s/.test(name)) {
            throw new Error('InvalidCharacterError: String contains an invalid character');
        }
    }

    /**
     * @private
     */
    function createClassList(el) {
        var classList = {
            item: function(index) {
                if (arguments.length == 0) {
                    throw new TypeError('Not enough arguments');
                }
                return getClassNames(el)[Number(index)] || null;
            },

            contains: function(name) {
                if (arguments.length == 0) {
                    throw new TypeError('Not enough arguments');
                }

                name = String(name);
                checkClassName(name);

                return getClassNames(el).indexOf(name) > -1;
            },

            add: function() {
                if (arguments.length == 0) {
                    throw new TypeError('Not enough arguments');
                }

                var classNames = getClassNames(el);
                var origClassNameCount = classNames.length;

                for (var i = 0, l = arguments.length; i < l; i++) {
                    var name = String(arguments[i]);
                    checkClassName(name);

                    if (classNames.indexOf(name) == -1) {
                        classNames.push(name);
                    }
                }

                if (classNames.length > origClassNameCount) {
                    el.className = classNames.join(' ');
                }
            },

            remove: function() {
                if (arguments.length == 0) {
                    throw new TypeError('Not enough arguments');
                }

                var classNames = getClassNames(el);
                var origClassNameCount = classNames.length;

                for (var i = 0, l = arguments.length; i < l; i++) {
                    var name = String(arguments[i]);
                    checkClassName(name);

                    var index;

                    while ((index = classNames.indexOf(name)) > -1) {
                        classNames.splice(index, 1);
                    }
                }

                if (classNames.length < origClassNameCount) {
                    el.className = classNames.join(' ');
                }
            },

            toggle: function() {
                if (arguments.length == 0) {
                    throw new TypeError('Not enough arguments');
                }

                var classNames = getClassNames(el);

                for (var i = 0, l = arguments.length; i < l; i++) {
                    var name = String(arguments[i]);
                    checkClassName(name);

                    var index = classNames.indexOf(name);

                    if (index == -1) {
                        classNames.push(name);
                    } else {
                        do {
                            classNames.splice(index, 1);
                        } while ((index = classNames.indexOf(name)) > -1);
                    }
                }

                el.className = classNames.join(' ');
            }
        };

        try {
           Object.defineProperty(classList, 'length', {
               get: function() {
                   return getClassNames(el).length;
               },
               configurable: false,
               enumerable: false
           });
        } catch (err) {}

        return classList;
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
     */
    if (!document.documentElement.classList) {
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                return this.classList = createClassList(this);
            },
            configurable: true,
            enumerable: false
        });
    }

})();
