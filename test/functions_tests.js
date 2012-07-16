var b_ = require("./../lib/boneidle");

module.exports = {
    "Multiply by  3":function (test) {
        b_(1, 2, 3, 4, 5, 6).map(b_.functions.multiplyBy(3)).realise(function (value) {
            test.same(value, [3, 6, 9, 12, 15, 18]);
            test.done()
        });
    },
    "Divide by 3":function (test) {
        b_(3, 6, 9, 12, 15, 18).map(b_.functions.divideBy(3)).realise(function (value) {
            test.same(value, [1, 2, 3, 4, 5, 6]);
            test.done()
        });
    },
    "Sum":function (test) {
        b_(3, 6, 9, 12, 15, 18).foldLeft(0, b_.functions.sum, function (value) {
            test.same(value, 63);
            test.done()
        });
    }
}