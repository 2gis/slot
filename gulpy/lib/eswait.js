
var assert = require('assert');


/**
 * Ждет завершения потоков и вызывает cb
 * @param {Stream[]} streams
 * @param {function} cb
 * @returns {*}
 */
function wait(streams, cb) {
    var counter = streams.length;

    streams.forEach(function(stream) {
        stream.on('end', function() {
            counter--;
            assert(counter >= 0, "Streams counter must be 0 or greater");
            if (counter == 0) {
                cb();
            }
        });
        if (stream.listeners('data').length == 0) {
            stream.on('data', function() {}); // we must consume data for end event http://nodejs.org/api/stream.html#stream_event_end
        }
        stream.on('error', function(err) {
            cb(err);
        });
    });

    return streams;
}

module.exports = wait;