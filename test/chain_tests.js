var b_ = require("./../lib/boneidle");

module.exports = {
    "Chain callbacks test":function (test) {
        var chain = b_.chain.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("my param", function (either) {
            test.ok(either.right());
            test.done();
        });
    },
    "Chain fails first callback":function (test) {
        var chain = b_.chain.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("s", function (either) {
            test.ok(either.isLeft());
            test.done();
        });
    },
    "Chain fails second callback":function (test) {
        var chain = b_.chain.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call(null, function (either) {
            test.ok(either.isLeft());
            test.done();
        });
    }
}
function isNotNull(value, callback) {
    if (value) {
        callback(b_.either.right(value));
    } else {
        callback(b_.either.left(value));
    }
}
function hasLengthGreaterThan2(value, callback) {
    if (value.length > 2) {
        callback(b_.either.right(value));
    } else {
        callback(b_.either.left(value));
    }
}