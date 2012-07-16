var b_ = require("./../lib/boneidle");

module.exports = {
    "Even":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.even).realise(function (value) {
            test.same(value, [2, 4, 6]);
            test.done()
        });
    },
    "Even":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.odd).realise(function (value) {
            test.same(value, [1, 3, 5]);
            test.done()
        });
    },
    "Not Even":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.not(b_.predicates.even)).realise(function (value) {
            test.same(value, [1, 3, 5]);
            test.done()
        });
    },
    "Not isBlank":function (test) {
        b_(undefined, null, "hello", "").filter(b_.predicates.not(b_.predicates.isBlank)).realise(function (value) {
            test.same(value, ["hello"]);
            test.done()
        });
    },
    "Greater than 3":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.greaterThan(3)).realise(function (value) {
            test.same(value, [4, 5, 6]);
            test.done()
        });
    },
    "Less than 3":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.lessThan(3)).realise(function (value) {
            test.same(value, [1, 2]);
            test.done()
        });
    },
    "Equals":function (test) {
        b_(1, 2, 3, 4, 5, 6).filter(b_.predicates.equals(3)).realise(function (value) {
            test.same(value, [3]);
            test.done()
        });
    }

};
