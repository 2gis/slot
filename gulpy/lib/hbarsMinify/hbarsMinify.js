
var handlebars = require('handlebars');

function dumpAst(ast, visitor) {
    visitor = visitor || function() {};

    function esc(str) {
        if (str) {
            return ' ' + str;
        }
        return str;
    }

    function it(func) {
        return function(arg) {
            return func(arg);
        };
    }

    function original(node) {
        return node.original;
    }

    var visitors = {
        'content': function(node) {
            return node.string;
        },
        'program': function(node) {
            var out = '';
            node.statements.forEach(function(statement) {
                out += accept(statement);
            });
            return out;
        },
        'ID': original,
        'INTEGER': original,
        'STRING': function(node) {
            return "'" + node.original + "'";
        },
        'DATA': function(node) {
            return node.id;
        },
        'BOOLEAN': function(node) {
            return node.bool;
        },
        'PARTIAL_NAME': function(node) {
            return node.name;
        },
        'comment': function() {
            return ''; // strip comments
        },
        'partial': function(node) {
            var out = '{{> ' + accept(node.partialName);
            if (node.context) {
                out += ' ' + accept(node.context);
            }
            return out + '}}';
        },
        'hash': function(node) {
            var out = [];
            node.pairs.forEach(function(pair) {
                var key = pair[0];
                var value = accept(pair[1]);
                out.push(key + '=' + value);
            });
            return out.join(' ');
        },
        'mustache': function(node, isBlock) {
            var params = node.params.map(it(accept)).join(' ');
            var out = '{{';
            if (isBlock) {
                out += '#';
            }
            out += accept(node.id) + esc(params);
            if (node.hash) {
                out += ' ' + accept(node.hash);
            }
            out += '}}';

            return out;
        },
        'block': function(node) {
            var out = accept(node.mustache, true);
            out += accept(node.program);
            if (node.inverse) {
                out += '{{else}}';
                out += accept(node.inverse);
            }
            out += '{{/' + accept(node.mustache.id) + '}}';
            return out;
        }
    };

    function accept(node) {
        visitor(node);
        if (visitors[node.type]) {
            return visitors[node.type].apply(this, arguments);
        }
        throw new Error("Not exists visitor for node type " + node.type);
    }

    return accept(ast);
}

exports.ast = function(ast) {
    var headingSpace = /^\s+</,
        trailingSpace = />\s+$/,
        tagCounter = 0;

    function tagWeight(string) {
        var cc = 0;
        for (var i = 0, len = string.length; i < len; i++) {
            var char = string.charAt(i);

            if (char == '<') cc++;
            if (char == '>') cc--;
        }
        return cc;
    }

    function accept(node) {
        if (node.type == 'content') {
            node.string = node.string.replace(/>\s+</g, '><');

            var content = node.string;

            tagCounter += tagWeight(content);

            if (headingSpace.test(content)) {
                node.string = node.string.trimLeft();
            }

            if (tagCounter == 0) {
                if (trailingSpace.test(content)) {
                    node.string = node.string.trimRight();
                }

                if (!node.string.trim()) {
                    node.string = '';
                }
            }

            node.string = node.string.replace(/\\(\s+)/g, ' ');
        }
    }

    return dumpAst(ast, accept);
};

exports.template = function(template) {
    var ast = handlebars.parse(template);
    return exports.ast(ast);
};