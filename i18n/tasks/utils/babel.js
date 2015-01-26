
var _ = require('lodash');
var exec = require('child_process').exec;

function babel(pot, options, done) {

    var joinArgs = pot.lib('joinArgs');

    // Merge task-specific and/or target-specific options with these defaults.
    options = _.defaults(options, {
        executable: 'pybabel'
    });

    var commandOptions = _.omit(options, 'executable', 'command', 'src', 'dest', 'locale', 'verbose');
    var execCommand = [options.executable];

    if (!options.command) {
        return done('Не задана команда для Babel');
    }

    execCommand.push(options.command);
    execCommand = execCommand.concat(joinArgs(commandOptions));

    var inputPo,
        locale;

    switch (options.command) {
        case 'extract':
            if (options.dest) {
                execCommand.push('-o ' + options.dest);
            }

            if (options.src && options.src.length) {
                execCommand = execCommand.concat(options.src);
            } else {
                execCommand.push('./');
            }
            break;
        case 'init':
            inputPo = options.src;
            execCommand.push('-i ' + inputPo);

            locale = options.locale;
            if (!locale) {
                return done("You must define --locale option for init command");
            }
            execCommand.push('-l ' + locale);

            execCommand.push('-d ' + options.dest);
            break;
        case 'update':
            inputPo = options.src;
            execCommand.push('-i ' + inputPo);

            locale = options.locale;
            if (locale) {
                execCommand.push('-l ' + locale);
            }

            execCommand.push('-d ' + options.dest);
            break;

        // Здесь можно добавлять команды babel
    }

    var resultCommand = execCommand.join(' ');
    if (options.verbose) {
        console.log('Команда: ' + resultCommand);
    }

    // Запускаем команду
    exec(resultCommand, function(error, stdout, stderr) {
        if (options.verbose) {
            console.log(stderr);
        }

        done(error);
    });
}

module.exports = function(pot) {
    return _.partial(babel, pot);
};