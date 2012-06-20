var option = require("./boneidle.option");

module.exports = {
    firstMatch:firstMatch
}

function firstMatch(iterator, predicate, callback) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (value) {
                predicate(value, function (passed) {
                    if (passed) {
                        callback(option.some(value));
                    } else {
                        firstMatch(iterator, predicate, callback);
                    }
                });
            })
        } else {
            callback(option.none());
        }
    });
}