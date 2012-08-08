var b_ = require("./../lib/boneidle");

module.exports = {
    "Valid Object":function (test) {
        var valid = b_.validity.valid("value");
        test.ok(valid.isValid());
        test.same(valid.value(), "value");
        test.done();
    },
    "Invalid Object":function (test) {
        var invalid = b_.validity.invalid("value");
        test.ok(!invalid.isValid());
        test.same(invalid.value(), "value")
        test.done();
    }
}