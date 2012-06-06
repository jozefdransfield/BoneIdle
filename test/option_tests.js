var b_ = require("./../lib/boneidle");

module.exports = {
    "Option with value tests":function (test) {
        var some = b_.option.some("a value");
        test.ok(!some.isEmpty());
        test.same(some.get(), "a value");
        test.same(some.getOr("another value"), "a value");
        test.same(some.getOrNull(), "a value");
        test.done();
    },
    "Name And Value":function (test) {
        var nv = b_.namevalue.nameValue("a name", "a value");
        test.same(nv.name, "a name");
        test.same(nv.value, "a value");
        test.done();
    },
    "Option with no value tests":function (test) {
        var some = b_.option.none();
        test.ok(some.isEmpty());
        test.same(some.get(), undefined);
        test.same(some.getOr("another value"), "another value");
        test.same(some.getOrNull(), null);
        test.done();
    }
}