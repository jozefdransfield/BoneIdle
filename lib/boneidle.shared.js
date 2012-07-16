var option = require("./boneidle.option");

module.exports = {
    firstMatch:firstMatch,
    tick: tick
}

function firstMatch(iterator, predicate, callback) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (value) {
                predicate(value, function (passed) {
                    if (passed) {
                        callback(option.some(value));
                    } else {
                        tick(function() {
                            firstMatch(iterator, predicate, callback);
                        });
                    }
                });
            })
        } else {
            callback(option.none());
        }
    });
}

function tick(f) {
      if (typeof window != 'undefined') {
          window.setTimeout(f, 0);
      } else {
          process.nextTick(f)
      }
}