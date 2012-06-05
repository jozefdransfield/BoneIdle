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
    "Option with value tests":function (test) {
        var some = b_.some("a value");
        test.ok(!some.isEmpty());
        test.same(some.get(), "a value");
        test.same(some.getOr("another value"), "a value");
        test.same(some.getOrNull(), "a value");
        test.done();
    },
    "Name And Value":function (test) {
        var nv = b_.nameValue("a name", "a value");
        test.same(nv.name, "a name");
        test.same(nv.value, "a value");
        test.done();
    },
    "Option with no value tests":function (test) {
        var some = b_.none();
        test.ok(some.isEmpty());
        test.same(some.get(), undefined);
        test.same(some.getOr("another value"), "another value");
        test.same(some.getOrNull(), null);
        test.done();
    },
    "Either with left": function(test) {
        var left = b_.left("a value");
        test.ok(left.isLeft());
        test.ok(!left.isRight())
        test.same(left.left(), "a value");
        test.same(left.right(), undefined);
        test.done();
    },
    "Either with right": function(test) {
        var right = b_.right("a value");
        test.ok(right.isRight())
        test.ok(!right.isLeft());
        test.same(right.right(), "a value");
        test.same(right.left(), undefined);
        test.done();
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
            test.same(value, [b_.nameValue("a", 1), b_.nameValue("b", 2), b_.nameValue("c", 3)]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with Iterator":function (test) {
        b_.sequence(new DummyIterator()).take(1, function (value) {
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
    "Map Function with callback":function (test) {
        b_.sequence([1, 2, 3]).map(b_.usingCallback(multiplyBy100withCallback)).realise(function (value) {
            test.same(value, [100, 200, 300]);
            test.done();
        });
    },
    "Flat Map Function":function (test) {
        b_.debug_sequence([1, 2, 3]).map(multiplyBy100).realise(function (value) {
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
    "Fold FunctionUsingCallback":function (test) {
        b_.sequence([1, 2, 3]).foldLeft(0, b_.usingCallback(sumWithCallback), function (value) {
            test.equals(value, 6);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Array":function (test) {
        b_.sequence([]).head(function (value) {
            test.ok(value.isEmpty());
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Sequence":function (test) {
        b_.sequence().head(function (value) {
            test.ok(value.isEmpty());
            test.done();
        });
    },
    "Filter Function":function (test) {
        b_.sequence(1, 2, 3, 4).filter(even).realise(function (value) {
            test.same(value, [2, 4]);
            test.done();
        });
    },
    "Filter Function With Callback":function (test) {
        b_.sequence(1, 2, 3, 4).filter(b_.usingCallback(evenWithCallback)).realise(function (value) {
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
    "Find Function using callback":function (test) {
        b_.sequence(1, 2, 3, 4).find(b_.usingCallback(evenWithCallback), function (option) {
            test.equals(option.get(), 2)
            test.done()
        })
    },
    "Take X From sequence":function (test) {
        b_.sequence(1, 2, 3, 4).take(2, function (value) {
            test.same(value, [1, 2])
            test.done()
        })
    },
    "Take While From sequence":function (test) {
        b_.sequence(1, 2, 3, 4).takeWhile(lessThan3, function (value) {
            test.same(value, [1, 2])
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
    },
    "Join Sequences returns the combined contents":function (test) {
        b_.sequence([1, 2, 3]).join(b_.sequence(4, 5, 6)).realise(function (values) {
            test.same(values, [1, 2, 3, 4, 5, 6]);
            test.done();
        })
    },
    "Chain callbacks test":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("my param", function (either) {
            test.ok(either.right());
            test.done();
        });
    },
    "Chain fails first callback":function (test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call("s", function(either) {
            test.ok(either.isLeft());
            test.done();
        });
    },
    "Chain fails second callback": function(test) {
        var chain = b_.chain(isNotNull).and(hasLengthGreaterThan2);
        chain.call(null, function(either) {
            test.ok(either.isLeft());
            test.done();
        });
    }
};


function multiplyBy100(i) {
    return i * 100;
}
function multiplyBy100withCallback(i, callback) {
    callback(i*100);
}
function sum(seed, i) {
    return seed + i;
}
function sumWithCallback(seed, i, callback) {
    callback(seed + i);
}
function even(i) {
    return i % 2 == 0;
}
function evenWithCallback(i, callback) {
    callback(i % 2 == 0);
}
function addNewLine(s) {
    return s += "\n";
}
function allways() {
    return true;
}
function DummyIterator() {
    this.hasNext=function (callback) {
            callback(true);
    }
    this.next=function (callback) {
            callback(1);
    }
}
DummyIterator.prototype = new b_.iterators.Iterator();
function lessThan3(i) {
    return i < 3;
}
function isNotNull(value, callback) {
    if (value) {
        callback(b_.right(value));
    } else {
        callback(b_.left(value));
    }
}
function hasLengthGreaterThan2(value, callback) {
    if (value.length > 2) {
        callback(b_.right(value));
    } else {
        callback(b_.left(value));
    }
}

