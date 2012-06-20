var b_ = require("./../lib/boneidle");

module.exports = {
    "Pair Test":function (test) {
        var nv = b_.pair("a name", "a value");
        test.same(nv.first, "a name");
        test.same(nv.second, "a value");
        test.done();
    }

}