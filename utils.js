
exports.invoke = function(func, args) {
    if (func) {
        return func.apply({}, args || []);
    }
};