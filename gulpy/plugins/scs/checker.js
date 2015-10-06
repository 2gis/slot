var _ = require('lodash');

module.exports = function(filename, contents, options) {
    var text = contents.toString().replace(/\r/g, '').replace(/([ ]*\/\*([ \S]*?)\*\/)|([ ]*\/\/(.*)$)/gm, ''), // Выпиливаем все комментарии с окружающими их пробелами // .replace(/([ ]*\/\*([\s\S]*?)\*\/)|([ ]*\/\/(.*)$)/gm, '')
        lines = text.split("\n");

    // Удаляем все строки, в которых есть base64 @TODO выпиливать только всё что внутри url(..base64..)
    _.each(lines, function(line, key) {
        if (line.indexOf('base64') != -1) {
            lines[key] = '';
        }

        if (line.trim().indexOf('*') == 0) { /* @TODO сделать нормальную обработку многострочных комментариев */
            lines[key] = '';
        }

        if (line.trim().indexOf('-ms-filter') != -1) {
            lines[key] = '';
        }

        if (line.trim().indexOf('DXImageTransform') != -1) {
            lines[key] = '';
        }
    });

    var errors = [];

    // Каждая функция возвращает true если в данной линии всё хорошо
    var checkers = {
        // Проверяет что в начале строки только пробелы и их количество делится без остатка на multiple
        indent: function(line) {
            if (line.trim()) {
                var text = (line + '1').trim(),
                    start = (line + '1').indexOf(text);

                return start % options.indent === 0;
            }

            return true;
        },

        trailing: function(line, trailingDisallowed) {
            return trailingDisallowed && ('1' + line) === ('1' + line).trim();
        },

        spaceAfterComma: function(line, spaceAfterCommaRequired) {
            if (spaceAfterCommaRequired) {
                return !line.match(/,[^ ]+/g);
            } else {
                return !line.match(/,[ ]+/g);
            }
        },

        // space after :
        spaceAfterColon: function(line, spaceAfterColonRequired) {
            if (line.match(/:(?=before|after|nth|first|last|only|link|hover|active|visited|focus|disabled|not|checked|-ms-|-moz-|-webkit-|empty|blank|placeholder|-o-prefocus|selection)/g)) {
                return true;
            }

            if (spaceAfterColonRequired) {
                return !line.match(/:[^ ]/g);
            } else {
                return !line.match(/:[ ]/g);
            }
        },

        // ; after end
        semicolonAtEnd: function(line, semicolonAtEndRequired) {
            var start1 = line.indexOf('/*'),
                start2 = line.indexOf('//'),
                start3 = line.indexOf('*/');

            if (start1 == -1) start1 = 1 / 0;
            if (start2 == -1) start2 = 1 / 0;
            if (start3 == -1) start3 = 1 / 0;

            var start = Math.min(start1, start2, start3);

            if (start != -1) {
                line = line.substr(0, start);
            }
            line = line.trim();

            if (semicolonAtEndRequired) {
                return !line.match(/[a-z\)-0-9"'% ]+$/g) || line.match(/,$/g);
            } else {
                return true;
            }
        },

        // 0 before .0
        zeroBeforeDot: function(line, zeroBeforeDotRequired) {
            if (zeroBeforeDotRequired) {
                return line.indexOf(' .') == -1;
            } else {
                return line.indexOf('0.') == -1;
            }
        },

        // space before bracket
        spaceBeforeBrace: function(line, spaceBeforeBraceRequired) {
            if (spaceBeforeBraceRequired) {
                return !line.match(/[^ ]\{/g);
            } else {
                return !line.match(/[ ]\{/g);
            }
        },

        important: function(line) {
            return line.indexOf('!important') == -1;
        }

        // multible box-shadow, transitions etc

        // camelCase

        // формат комментариев

        // короткие цвета
    };

    _.each(lines, function(line, lineNum) {

        _.each(options, function(value, option) {
            var err = !checkers[option](line, value);

            if (err) {
                errors.push({
                    line: lineNum + 1,
                    option: option,
                    value: value
                });
            }
        });
    });

    return errors;
};
