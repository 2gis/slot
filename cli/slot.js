#!/usr/bin/env node

var _ = require('lodash');
var program = require('commander');
var prompt = require('prompt');
var extfs = require('extfs');
var colors = require('colors');
var templates = require('./templates');

program
    .version('1.0.0')
    .usage('<command> [options]');

function getSuccessInfo() {
    return [
        'Done. The app has been deployed to current working directory.',
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

        if (!extfs.isEmptySync(destPath)) {
            console.error('Error:'.red + ' Current directory is not empty.');
            console.error('Error:'.red + ' Please go to an empty dir and run again.');
            return;
        }

        var template = _.find(templates, {name: templateName});
        if (!template) {
            console.error('Error:'.red + ' no template named ' + templateName);
            console.error('Available templates:');
            console.error(getTemplatesInfo());
            return;
        }

        if (!_.isEmpty(template.params)) {
            console.log('Please answer the following questions:');
        }

        prompt.message = '* '.red;
        prompt.delimiter = '';
        prompt.get({properties: template.params}, function(err, params) {
            if (err) {
                return;
            }

            template.deploy(destPath, params, function(err) {
                if (err) {
                    return console.error('Error: '.red + err);
                }

                console.log(getSuccessInfo());
            });
        });
    });

program.parse(process.argv);
