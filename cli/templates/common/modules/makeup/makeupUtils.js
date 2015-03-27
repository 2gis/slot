var manifest = req('build/private/manifest'),
    _ = require('lodash');

module.exports = function() {
    var blocksPath = 'modules/',
        helpersPath = 'helpers/blocks/',
        templateProvider = require('slot/lib/templateProvider'),
        handlebars = require('slot/env').get('handlebars'),
        module;

    var utils = {

        // Возвращает список всех блоков
        getBlocks: function() {
            return _.map(manifest.blocks, function(block) {
                var blockConfig = utils.loadConfig(utils.getBlocksPath(), {name: block}),
                    aura = {},
                    details = [];

                if (blockConfig) {
                    aura = utils.getAura(blockConfig.status, manifest.complete, manifest.statusKeys.length);
                }

                for (var i = 0, len = manifest.statusKeys.length; i < len; i++) {
                    if (blockConfig && blockConfig.status && blockConfig.status[manifest.statusKeys[i]]) {
                        details[i] = blockConfig.status[manifest.statusKeys[i]];
                    } else details[i] = 0;
                }

                return {
                    type: 'block',
                    name: block,
                    label: block,
                    status: aura.status,
                    value: aura.value,
                    details: details
                };
            });
        }
    };

    return utils;
};
