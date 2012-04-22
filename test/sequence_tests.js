var b_ = require("./../lib/boneidle");

module.exports = {
    setUp:function (callback) {
        callback();
    },
    tearDown:function (callback) {
        callback();
    },
    "Realise Returns Array For Sequence Initialised with Array":function (test) {
        b_.sequence([1, 2, 3]).realise(function (err, value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with arguements":function (test) {
        b_.sequence(1, 2, 3).realise(function (err, value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with object":function (test) {
        b_.sequence({a:1, b:2, c:3}).realise(function (err, value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Map Function":function (test) {
        b_.sequence([1, 2, 3]).map(multiplyBy100).realise(function (err, value) {
            test.same(value, [100, 200, 300]);
            test.done();
        });
    },
    "Fold Function":function (test) {
        b_.sequence([1, 2, 3]).foldLeft(0, sum, function (err, value) {
            test.equals(value, 6);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Array":function (test) {
        b_.sequence([]).head(function (err, value) {
            test.ok(value.isEmpty);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Sequence":function (test) {
        b_.sequence().head(function (err, value) {
            test.ok(value.isEmpty);
            test.done();
        });
    },
    "Filter Function":function (test) {
        b_.sequence(1, 2, 3, 4).filter(even).realise(function (err, value) {
            test.same(value, [2, 4]);
            test.done();
        });
    },
    "Find Function":function (test) {
        b_.sequence(1, 2, 3, 4).find(even, function (err, option) {
            test.equals(option.get(), 2)
            test.done()
        })
    },
    "Find Function with No Matches Returns Empty Option":function (test) {
        b_.sequence(1, 3, 5, 7).find(even, function (err, option) {
            test.ok(option.isEmpty)
            test.done();
        });

    },
    "Read File":function (test) {
        b_.file("./test/sample.txt").realise(function (err, data) {
            test.equals(data, "Sample File Data");
            test.done();
        })
    },
    "Read File Then Map":function (test) {
        b_.file("./test/sample.txt").map(addNewLine).realise(function (err, data) {
            test.same(data, ["Sample File Data\n"]);
            test.done();
        })
    },
    "Read File then Filter":function (test) {
        b_.file("./test/sample.txt").filter(allways).realise(function (err, data) {
            test.same(data, ["Sample File Data"]);
            test.done();
        })
    }
};


function multiplyBy100(i) {
    return i * 100;
}
function sum(seed, i) {
    return seed + i;
}
function even(i) {
    return i % 2 == 0;
}
function addNewLine(s) {
    return s += "\n";
}
function allways() {
    return true;
}

