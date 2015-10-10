#!/usr/bin/env node

var fs = require('fs');
var ncp = require('ncp');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var extfs = require('extfs');
var glob = require('glob').sync;
var program = require('commander');

function requireTemplates() {
    var paths = glob(path.join(__dirname, 'templates/*/index.js'));

    return paths.map(function(path) {
        return require(path);
    });
}

function getSuccessInfo(name) {
    return [
        'Application ' + name + ' has been deployed to current working directory.',
        'Now run:',
        '',
        '    npm install',
        '    gulp dev',
        '',
        'This will install dependencies, build the app and launch the development',
        'server. The app will be accessible at http://localhost:3000/'
    ].join('\n');
}

function getTemplatesInfo(templates) {
    return templates.map(function(template) {
        return '    * '.red + template.name.grey + '\t' + template.description;
    }).join('\n');
}

function deployTemplate(template, destPath, callback) {
    var commonPath = path.join(__dirname, '/templates/common');
    var tmplPath = path.join(__dirname, '/templates', template.name, '/files');

    async.series(_.compact([
        template.type == 'app' ? _.partial(ncp, commonPath, destPath) : null,
        _.partial(ncp, tmplPath, destPath),
        template.postInstall ? _.partial(template.postInstall, destPath) : null
    ]), callback);
}

program
    .version('0.0.1')
    .usage('<command> [options]');

program
    .command('init [templateName]')
    .description('Scaffolds out a Slot.js app using one of the templates')
    .usage('[templateName]')
    .on('--help', function() {
        var appTemplates = _.filter(requireTemplates(), {type: 'app'});

        console.log('  Available application templates::\n');
        console.log(getTemplatesInfo(appTemplates));
    })
    .action(function(templateName) {
        var destPath = process.cwd();
        var templates = _.filter(requireTemplates(), {type: 'app'});

        templateName = templateName || 'basic';
        var template = _.find(templates, {name: templateName});
        if (!template) {
            console.error('Error:'.red + ' no template named ' + templateName);
            console.error('Available templates:');
            console.error(getTemplatesInfo(templates));
            return;
        }

        if (!extfs.isEmptySync(destPath)) {
            console.error('Error:'.red + ' Current directory is not empty.');
            console.error('Error:'.red + ' Please go to an empty dir and run again.');
            return;
        }

        deployTemplate(template, destPath, function(err, res) {
            if (err) {
                return console.error('Error: '.red + err);
            }

            console.log(getSuccessInfo(template.name));
        });
    });

program
    .command('addmodule <moduleName>')
    .description('Adds a new module to the existing Slot app')
    .usage('<moduleName>')
    .action(function(moduleName) {
        var appPath = process.cwd();
        if (!fs.existsSync(path.join(appPath, '/modules'))) {
            console.error('Error:'.red + ' Modules folder not found in ' + appPath);
            console.error('Error:'.red + ' Is it a Slot application?');
            return;
        }

        var modulePath = path.join(appPath, '/modules', moduleName);
        if (fs.existsSync(modulePath)) {
            console.error('Error:'.red + ' Module ' + moduleName + ' already exists');
            return;
        }

        fs.mkdirSync(modulePath);

        var moduleTemplate = _.find(requireTemplates(), {name: 'module'});
        deployTemplate(moduleTemplate, modulePath, function() {
            console.log('Module files added to ' + modulePath);
        });
    });

program.parse(process.argv);

// Показываем помощь, если утилита запущена без параметров
if (!process.argv.slice(2).length) {
    program.help();
}
