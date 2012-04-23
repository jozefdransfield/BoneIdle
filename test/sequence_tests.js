var b_ = require("./../lib/boneidle");
var fs = require("fs");
var http = require("http");
var url = require("url");

module.exports = {
    setUp:function (callback) {
        callback();
    },
    tearDown:function (callback) {
        callback();
    },
    "Realise Returns Array For Sequence Initialised with Array":function (test) {
        b_.sequence([1, 2, 3]).realise(function (value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with arguements":function (test) {
        b_.sequence(1, 2, 3).realise(function (value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with object":function (test) {
        b_.sequence({a:1, b:2, c:3}).realise(function (value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with Iterator":function (test) {
        b_.sequence(dummyIterator()).take(1, function (value) {
            test.same(value, [1]);
            test.done()
        });
    },
    "Map Function":function (test) {
        b_.sequence([1, 2, 3]).map(multiplyBy100).realise(function (value) {
            test.same(value, [100, 200, 300]);
            test.done();
        });
    },
    "Fold Function":function (test) {
        b_.sequence([1, 2, 3]).foldLeft(0, sum, function (value) {
            test.equals(value, 6);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Array":function (test) {
        b_.sequence([]).head(function (value) {
            test.ok(value.isEmpty);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Sequence":function (test) {
        b_.sequence().head(function (value) {
            test.ok(value.isEmpty);
            test.done();
        });
    },
    "Filter Function":function (test) {
        b_.sequence(1, 2, 3, 4).filter(even).realise(function (value) {
            test.same(value, [2, 4]);
            test.done();
        });
    },
    "Find Function":function (test) {
        b_.sequence(1, 2, 3, 4).find(even, function (option) {
            test.equals(option.get(), 2)
            test.done()
        })
    },
    "Take X From sequence":function (test) {
        b_.sequence(1, 2, 3, 4).take(2, function (value) {
            test.same(value, [1,2])
            test.done()
        })
    },
    "Take While From sequence":function (test) {
        b_.sequence(1, 2, 3, 4).takeWhile(lessThan3, function (value) {
            test.same(value, [1,2])
            test.done()
        })
    },
    "Find Function with No Matches Returns Empty Option":function (test) {
        b_.sequence(1, 3, 5, 7).find(even, function (option) {
            test.ok(option.isEmpty)
            test.done();
        });
    },
    "Read File Then Map":function (test) {
        b_.stream(fs.ReadStream("./test/sample.txt", {encoding:"utf8"})).map(addNewLine).realise(function (data) {
            console.log("I finished!")
            test.same(data, ["Sample File Data\n"]);
            test.done();
        })
    },
    "Read File then Filter":function (test) {
        b_.stream(fs.ReadStream("./test/sample.txt", {encoding:"utf8"})).filter(allways).realise(function (data) {
            test.same(data, ["Sample File Data"]);
            test.done();
        })
    },
    "Read File Stream returns contents":function (test) {
        b_.stream(fs.ReadStream("./test/sample.txt", {encoding:"utf8"})).realise(function (data) {
            test.same(data, ["Sample File Data"]);
            test.done();
        });
    },
    "Read Invalid File Stream returns error":function (test) {
        b_.stream(fs.ReadStream("./test/badfilename", {encoding:"utf8"})).realise(function (data) {
            test.ok(data[0] instanceof Error);
            test.done();
        });
    },
    "Read URL Stream returns contents":function (test) {
        var req = http.request(url.parse("http://www.google.com"), function (res) {
            res.setEncoding('utf8');
            b_.stream(res).realise(function (data) {
                test.ok(data);
                test.done();
            });
        });
        req.end();

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
    console.log(s);
    return s += "\n";
}
function allways() {
    return true;
}
function dummyIterator() {
    return {
        hasNext: function(callback) {
            callback(true);
        },
        next: function(callback) {
            callback(1);
        }
    }
}
function lessThan3(i) {
    return i < 3;
}

