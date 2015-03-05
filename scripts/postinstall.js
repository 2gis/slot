#!/usr/bin/env node

var path = require('path');
var fs = require('fs');

// install slot as symlink in node_modules
var nodeModulesPath = path.resolve(__dirname + '/../node_modules');
var slotLinkPath = nodeModulesPath + '/slot';
if (fs.existsSync(nodeModulesPath) && !fs.existsSync(slotLinkPath)) {
    var destPath = process.platform == 'win32' ? path.resolve(__dirname + '/..') : '..';
    try {
        fs.symlinkSync(destPath, slotLinkPath, 'junction');
    } catch (ex) {
        // on windows creating symlinks requires administrator rights
        var winHelp = process.platform == 'win32' ? ' or install slot with administrator rights' : '';
        console.warn('Can not create symlink from `%s` to `%s`. Please create them manually%s.', slotLinkPath, destPath, winHelp);
    }
}