module.exports = function(slot) {
    return {
        init: function(data, callback) {
            callback();
        },

        clientInit: function() {},

        viewContext: function() {},

        elements: {},

        interface: {},

        dispatcher: {}
    };
};
