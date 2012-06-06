var markers = require("./boneidle.markers");
var option = require("./boneidle.option");

module.exports = {
    firstMatch:firstMatch
}

function firstMatch(iterator, predicate, callback) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (value) {
                if (predicate instanceof markers.FunctionWithCallbackWrapper) {
                    predicate.func(value, function (passed) {
                        if (passed) {
                            callback(option.some(value));
                        } else {
                            firstMatch(iterator, predicate, callback);
                        }
                    });
                } else {
                    if (predicate(value)) {
                        callback(option.some(value));
                    } else {
                        firstMatch(iterator, predicate, callback);
                    }
                }
            })
        } else {
            callback(option.none());
        }
    });
}