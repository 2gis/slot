
module.exports = function(filename, errors) {
    console.warn('File: ' + filename);
    errors.map(function(err) {
        console.warn('    Line ' + err.line + ': ' + err.option + '');
    });
};