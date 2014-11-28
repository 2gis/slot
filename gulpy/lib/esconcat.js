
/*
 * из этого надо сделать плагин, не просите пока меня тут комментарии
 */

var through = require('through2');

function concat(streams) {
    var combiner = through.obj();
    var currentStream = 0;
    var buffers = {};
    var endFlags = {};

    function flushBuffer(index) {
        var chunks = buffers[index];
        if (chunks) {
            chunks.map(combiner.push, combiner);
        }
    }

    function stepForward(index) {
        flushBuffer(index);
        if (endFlags[index]) {
            return 1 + stepForward(index + 1);
        }
        return 1;
    }

    for (var i = 0, len = streams.length; i < len; i++) {
        (function(i) {
            streams[i]
                .on('data', function(file) {
                    if (currentStream == i) {
                        combiner.push(file);
                    } else {
                        buffers[i] = buffers[i] || [];
                        buffers[i].push(file);
                    }
                })
                .on('end', function() {
                    endFlags[i] = 1;
                    if (currentStream == i) {
                        currentStream += stepForward(i + 1);
                    }
                    if (currentStream == len) {
                        combiner.end();
                    }
                });
        })(i);
    }

    return combiner;
}

module.exports = concat;