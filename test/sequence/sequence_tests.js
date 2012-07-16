var b_ = require("./../../lib/boneidle");
var fs = require("fs");
var http = require("http");
var url = require("url");

module.exports = {
    "Realise Returns Array For Sequence Initialised with Array":function (test) {
        b_([1, 2, 3]).realise(function (value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with arguments":function (test) {
        b_(1, 2, 3).realise(function (value) {
            test.same(value, [1, 2, 3]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with object":function (test) {
        b_({a:1, b:2, c:3}).realise(function (value) {
            test.same(value, [b_.pair("a", 1), b_.pair("b", 2), b_.pair("c", 3)]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with nested objects":function (test) {
        b_({a: {"message": "hello"}, b:{"message": "world"}}).realise(function (value) {
            test.same(value, [b_.pair("a", {"message": "hello"}), b_.pair("b", {"message": "world"})]);
            test.done()
        });
    },
    "Realise Returns Array For Sequence Initialised with Iterator":function (test) {
        b_(new DummyIterator()).take(1, function (value) {
            test.same(value, [1]);
            test.done()
        });
    },
    "Map Function":function (test) {
        b_([1, 2, 3]).map(multiplyBy100).realise(function (value) {
            test.same(value, [100, 200, 300]);
            test.done();
        });
    },
    "Map Function with callback":function (test) {
        b_([1, 2, 3]).map$(multiplyBy100withCallback).realise(function (value) {
            test.same(value, [100, 200, 300]);
            test.done();
        });
    },
    "Flat Map function":function (test) {
        b_([1, 2, 3]).flatMap(expandToSequence).realise(function (val) {
            test.same(val, [1, 2, 3, 2, 4, 6, 3, 6, 9]);
            test.done();
        });
    },
    "Flat Map function with one argument":function (test) {
        b_([1]).flatMap(expandToSequence).realise(function (val) {
            test.same(val, [1, 2, 3]);
            test.done();
        });
    },
    "Fold Function":function (test) {
        b_([1, 2, 3]).foldLeft(0, sum, function (value) {
            test.equals(value, 6);
            test.done();
        });
    },
    "Fold FunctionUsingCallback":function (test) {
        b_([1, 2, 3]).foldLeft$(0, sumWithCallback, function (value) {
            test.equals(value, 6);
            test.done();
        });
    },
    "Head Returns Value":function (test) {
        b_([1, 2, 3]).head(function (value) {
            test.same(value.get(), 1);
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Array":function (test) {
        b_([]).head(function (value) {
            test.ok(value.isEmpty());
            test.done();
        });
    },
    "Head Returns Empty Option on Empty Sequence":function (test) {
        b_().head(function (value) {
            test.ok(value.isEmpty());
            test.done();
        });
    },
    "Filter Function":function (test) {
        b_(1, 2, 3, 4).filter(even).realise(function (value) {
            test.same(value, [2, 4]);
            test.done();
        });
    },
    "Filter Function With Callback":function (test) {
        b_(1, 2, 3, 4).filter$(evenWithCallback).realise(function (value) {
            test.same(value, [2, 4]);
            test.done();
        });
    },
    "Find Function":function (test) {
        b_(1, 2, 3, 4).find(even, function (option) {
            test.equals(option.get(), 2)
            test.done()
        })
    },
    "Find Function using callback":function (test) {
        b_(1, 2, 3, 4).find$(evenWithCallback, function (option) {
            test.equals(option.get(), 2)
            test.done()
        })
    },
    "Take X From sequence":function (test) {
        b_(1, 2, 3, 4).take(2, function (value) {
            test.same(value, [1, 2])
            test.done()
        })
    },
    "Take While From sequence":function (test) {
        b_(1, 2, 3, 4).takeWhile(lessThan3, function (value) {
            test.same(value, [1, 2])
            test.done()
        })
    },
    "Take While From sequence with callback":function (test) {
        b_(1, 2, 3, 4).takeWhile$(lessThan3WithCallback, function (value) {
            test.same(value, [1, 2])
            test.done()
        })
    },
    "Find Function with No Matches Returns Empty Option":function (test) {
        b_(1, 3, 5, 7).find(even, function (option) {
            test.ok(option.isEmpty)
            test.done();
        });
    },
    "Join Sequences returns the combined contents":function (test) {
        b_([1, 2, 3]).join(b_(4, 5, 6)).realise(function (values) {
            test.same(values, [1, 2, 3, 4, 5, 6]);
            test.done();
        })
    },
    "Sequences should not stack overflow":function (test) {
        b_.range(1, 5000).realise(function(data) {
	     test.done();
        });
    },
    "Sequences should not stack overflow with a filter":function (test) {
        b_.range(1, 5000).filter(lessThan3).realise(function(data) {
	     test.done();
        });
    }
    
    //TODO: Add a split on test with and without callback
    //TODO: Add a test for flatMap with callback

};
function multiplyBy100(i) {
    return i * 100;
}
function multiplyBy100withCallback(i, callback) {
    callback(i * 100);
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

function DummyIterator() {
    this.hasNext = function (callback) {
        callback(true);
    }
    this.next = function (callback) {
        callback(1);
    }
}
DummyIterator.prototype = new b_.iterators.Iterator();
function lessThan3(i) {
    return i < 3;
}
function lessThan3WithCallback(i, callback) {
    callback(i < 3);
}
function expandToSequence(val) {
    return b_([val * 1, val * 2, val * 3]);
}
