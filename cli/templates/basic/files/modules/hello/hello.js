module.exports = function(slot) {
    var hello = {
        init: function(data, callback) {
            callback();
        },

        viewContext: function() {
            return {
                message: 'Welcome to Slot!'
            };
        }
    };

    return hello;
};
