#!/usr/bin/env node

var ncp = require('ncp');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var extfs = require('extfs');
var colors = require('colors');
var program = require('commander');
var templates = require('./templates');

program
    .version('1.0.0')
    .usage('<command> [options]');

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

function getTemplatesInfo() {
    return templates.map(function(template) {
        return '    * '.red + template.name.grey + '\t' + template.description;
    }).join('\n');
}

function deployTemplate(template, destPath, callback) {
    var commonPath = path.join(__dirname, '/templates/common');
    var tmplPath = path.join(__dirname, '/templates', template.name, '/files');

    async.series(_.compact([
        _.partial(ncp, commonPath, destPath),
        _.partial(ncp, tmplPath, destPath),
        template.postInstall ? _.partial(template.postInstall, destPath) : null
    ]), callback);
}

program.on('--help', function() {
    console.log('  Available templates:\n');
    console.log(getTemplatesInfo());
});

program
    .command('init <templateName>')
    .description('Scaffolds out a Slot.js app using one of the templates')
    .usage('<templateName>')
    .on('--help', function() {
        console.log('  Available templates:\n');
        console.log(getTemplatesInfo());
    })
    .action(function(templateName) {
        var destPath = process.cwd();

        var template = _.find(templates, {name: templateName});
        if (!template) {
            console.error('Error:'.red + ' no template named ' + templateName);
            console.error('Available templates:');
            console.error(getTemplatesInfo());
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

program.parse(process.argv);
