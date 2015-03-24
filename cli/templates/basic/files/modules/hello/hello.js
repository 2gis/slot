module.exports = function(slot) {
    var hello = {
        init: function(data, callback) {
            callback();
        },

        viewContext: function() {
            return {
                message: 'Hello world!'
            };
        }
    };

    return hello;
};
