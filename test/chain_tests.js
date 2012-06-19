var b_ = require("./../lib/boneidle");

module.exports = {
    "Chain callbacks test":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("my param", function (option) {
            test.ok(!option.isEmpty());
            test.done();
        });
    },
    "Chain fails first callback":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("s", function (option) {
            test.ok(option.isEmpty());
            test.done();
        });
    },
    "Chain fails second callback":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call(null, function (option) {
            test.ok(option.isEmpty());
            test.done();
        });
    }
}
function isNotNull(value, callback) {
    if (value) {
        callback(b_.option.some(value));
    } else {
        callback(b_.option.none());
    }
}
function hasLengthGreaterThan2(value, callback) {
    if (value.length > 2) {
        callback(b_.option.some(value));
    } else {
        callback(b_.option.none());
    }
}

