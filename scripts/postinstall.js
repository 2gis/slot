#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var os = require('os');

// install slot as symlink in node_modules
var nodeModulesPath = path.resolve(__dirname + '/../node_modules');
var slotLinkPath = nodeModulesPath + '/slot';
if (fs.existsSync(nodeModulesPath) && !fs.existsSync(slotLinkPath)) {
    var destPath = os.platform() == 'win32' ? path.resolve(__dirname + '/..') : '..';
    try {
        fs.symlinkSync(destPath, slotLinkPath, 'junction');
    } catch (ex) {
        // on windows creating symlinks requires administrator rights
        console.warn('Can not create symlink from `%s` to `%s`. Please create them manually.', slotLinkPath, destPath);
    }
}