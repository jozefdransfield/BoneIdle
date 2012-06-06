var b_ = require("./../lib/boneidle");

module.exports = {
    "Either with left":function (test) {
        var left = b_.either.left("a value");
        test.ok(left.isLeft());
        test.ok(!left.isRight())
        test.same(left.left(), "a value");
        test.same(left.right(), undefined);
        test.done();
    },
    "Either with right":function (test) {
        var right = b_.either.right("a value");
        test.ok(right.isRight())
        test.ok(!right.isLeft());
        test.same(right.right(), "a value");
        test.same(right.left(), undefined);
        test.done();
    }
}