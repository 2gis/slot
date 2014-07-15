
var _ = require('lodash'),
    smokesignals = envRequire('smokesignals');

module.exports = function(internals) {

    function filterModules(fromId, name, predicate, inclusive) {
        var currModule = internals.moduleInstances[fromId],
            result = [];

        function matchType(type) {
            return name == '*' || name == type;
        }

        function matchPredicate(instance, module) {
            if (!predicate) return true;

            if (!predicate.isMod) {
                if (!instance.interface) {
                    return false;
                }

                return instance.interface[predicate.name].apply(instance, predicate.args);
            } else {
                var mods = module.slot.mod(),
                    res = predicate.name in mods;

                if (res && predicate.args.length) {
                    res = mods[predicate.name] == predicate.args.join(',');
                }

                return res;
            }
        }

        function accumulate(id) {
            var currModule = internals.moduleInstances[id];

            if (matchType(currModule.type) && matchPredicate(currModule.instance, currModule)) {
                result.push(id);
            }

            _.each(currModule.children, accumulate);
        }

        if (inclusive) {
            accumulate(fromId);
        } else {
            _.each(currModule.children, accumulate);
        }

        return result;
    }

    function queryModules(fromId, selector, inclusive) {
        var sel = selector.split(/\s+/);

        var ruleRe = /([\w\*]+)(\[([^\]]+)\])?/;

        function parsePredicate(str) {
            var name = str,
                args = [],
                isMod = false;


            if (str.charAt(0) == ':') {
                isMod = true;
                name = str.substr(1);
            }

            var indexOfEq = name.indexOf('=');

            if (indexOfEq != -1) {
                args = name.substr(indexOfEq + 1).split(',');
                name = name.substr(0, indexOfEq);
            }

            return {
                name: name,
                args: args,
                isMod: isMod
            };
        }

        var ids = [fromId];

        for (var i = 0, len = sel.length; i < len; i++) {
            var rule = ruleRe.exec(sel[i]);
            if (!rule) throw new Error("Invalid selector " + selector);

            var name = rule[1];
            var predicate = rule[3] && parsePredicate(rule[3]);

            var newIds = [];

            for (var k = 0, kLen = ids.length; k < kLen; k++) {
                var id = ids[k];
                newIds = newIds.concat(filterModules(id, name, predicate, inclusive));
            }

            ids = newIds.slice();
            if (!ids.length) break;
        }

        return _.map(ids, function(id) {
            return internals.moduleInstances[id];
        });
    }

    return queryModules;
};
