var b_ = require("./../lib/boneidle");

module.exports = {
    "Realise on a range returns those numbers":function (test) {
        b_.range(1, 5).realise(function (value) {
            test.same(value, [1, 2, 3, 4, 5]);
            test.done()
        });
    }
};
