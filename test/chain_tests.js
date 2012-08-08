var b_ = require("./../lib/boneidle");

module.exports = {
    "Chain callbacks test":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("my param", function (validity) {
            test.ok(validity.isValid());
            test.done();
        });
    },
    "Chain fails first callback":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("s", function (validity) {
            test.ok(!validity.isValid());
            test.done();
        });
    },
    "Chain fails second callback":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call(null, function (validity) {
            test.ok(!validity.isValid());
            test.done();
        });
    }
}
function isNotNull(value, callback) {
    if (value) {
        callback(b_.validity.valid(value));
    } else {
        callback(b_.validity.invalid(value));
    }
}
function hasLengthGreaterThan2(value, callback) {
    if (value.length > 2) {
        callback(b_.validity.valid(value));
    } else {
        callback(b_.validity.invalid(value));
    }
}

