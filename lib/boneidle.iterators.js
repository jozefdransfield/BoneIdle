var pair = require("./boneidle.pair");
var shared = require("./boneidle.shared");

module.exports = {
    Iterator: Iterator,
    MapIterator: MapIterator,
    FlatMapIterator: FlatMapIterator,
    ArrayIterator: ArrayIterator,
    JoinedIterator: JoinedIterator,
    ObjectIterator: ObjectIterator,
    FilterIterator: FilterIterator,
    RangeIterator: RangeIterator,
    EmptyIterator: EmptyIterator,
    SplitOnIterator: SplitOnIterator,
    StreamIterator: StreamIterator
}

function Iterator() {
    this.hasNext = function (callback) {

    }
    this.next = function (callback) {

    }
}

function MapIterator(iterator, func) {
    this.prototype = new Iterator();
    this.hasNext = iterator.hasNext;
    this.next = function (callback) {
        if (callback) {
            iterator.next(function (value) {
                func(value, callback);
            });
            return;
        }
        return func(iterator.next());
    }
}

function FlatMapIterator(iterator, func) {
    var currentIterator;
    this.hasNext = function (callback) {
        if (currentIterator) {
            currentIterator.hasNext(function (hasNext) {
                if (hasNext) {
                    callback(true);
                } else {
                    currentIterator = null;
                    findFirstSequenceWithNext(iterator, func, function (hasNext, s) {
                        if (hasNext) {
                            currentIterator = s;
                            callback(true);
                        } else {
                            callback(false);
                        }
                    })
                }
            })
        } else {
            findFirstSequenceWithNext(iterator, func, function (hasNext, s) {
                if (hasNext) {
                    currentIterator = s;
                    callback(true);
                } else {
                    callback(false);
                }
            })
        }
    }
    this.next = function (callback) {
        currentIterator.next(callback);
    }

    function findFirstSequenceWithNext(iterator, func, callback) {
        iterator.hasNext(function (hasNext) {
            if (hasNext) {
                iterator.next(function (next) {
                    var s = func(next);
                    s.hasNext(function (childHasNext) {
                        if (childHasNext) {
                            callback(true, s);
                        } else {
                            findFirstSequenceWithNext(iterator, func, callback);
                        }
                    })
                })
            } else {
                callback(false);
            }
        })
    }
}

function ArrayIterator(array) {
    this.prototype = new Iterator();
    var i = 0;
    this.hasNext = function (callback) {
        callback(i < array.length);
    }
    this.next = function (callback) {
        callback(array[i++]);
    }
}

function JoinedIterator(sequences) {
    this.prototype = new Iterator();
    var active = 0;
    this.hasNext = function (callback) {
        findFirstSequenceWithNext(callback)
    }
    function findFirstSequenceWithNext(callback) {
        sequences[active].hasNext(function (hasNext) {
            if (hasNext) {
                callback(true)
            } else {
                if (active < sequences.length - 1) {
                    active++;
                    findFirstSequenceWithNext(callback)
                } else {
                    callback(false);
                }
            }
        });
    }

    this.next = function (callback) {
        sequences[active].next(function (value) {
            callback(value);
        })
    }
}

function ObjectIterator(obj) {
    this.prototype = new Iterator();
    var keys = Object.keys(obj);
    var arrayIterator = new ArrayIterator(keys);
    this.hasNext = arrayIterator.hasNext;
    this.next = function (callback) {
        arrayIterator.next(function (key) {
            callback(new pair.Pair(key, obj[key]));
        });
    }
}

function FilterIterator(iterator, predicate) {
    var next;
    this.hasNext = function (callback) {
        shared.firstMatch(iterator, predicate, function (option) {
            next = option;
            if (!option.isEmpty()) {
                callback(true)
            } else {
                callback(false)
            }
        });
    }
    this.next = function (callback) {
        if (next) {
            callback(returnAndClear(next).get());
        } else {
            firstMatch(iterator, predicate, callback);
        }
    }
}

function RangeIterator(from, to) {
    var i = from;
    this.hasNext = function (callback) {
        callback(i <= to);
    }
    this.next = function (callback) {
        callback(i++);
    }
}

function EmptyIterator() {
    this.hasNext = function (callback) {
        callback(false);
    }
    this.next = function () {
        throw "Empty Iterator";
    }
}

function SplitOnIterator(iterator, predicate) {
    var next;
    this.hasNext = function () {
        next = findWhileNotMatches(iterator, predicate);
        return next.hasNext();
    }
    this.next = function () {
        if (next) {
            return returnAndClear(next);
        } else {
            return findWhileNotMatches(iterator, predicate);
        }
    }
}

function StreamIterator(stream) {
    var self = this;
    var callbacks = [];
    var buffer = [];
    var closed = false;
    stream.on('data', handleData);

    stream.on("error", function (err) {
        handleData(err);
        stream.emit("close");
    });
    stream.on('end', handleEndOrClose);
    stream.on('close', handleEndOrClose);

    function handleEndOrClose() {
        closed = true;
        runTopCallback();

    }

    function handleData(data) {
        buffer.push(data);
        runTopCallback();
    }

    function runTopCallback() {
        if (callbacks.length > 0) {
            var callback = callbacks.pop();
            callback();
        }
    }

    this.hasNext = function (callback) {
        if (buffer.length > 0) {
            callback(true)
        } else {
            callbacks.push(function () {
                callback(!closed);
            });
        }
    }
    this.next = function (callback) {
        if (buffer.length > 0) {
            callback(buffer.pop());
        } else {
            callbacks.push(function () {
                callback(buffer.pop());
            });
        }
    }
}

function findWhileNotMatches(iterator, predicate) {
    var values = [];
    var currentValue;
    while ((currentValue = iterator.next()) && !predicate(currentValue)) {
        values.push(currentValue);
    }
    return sequence(values);
}

function returnAndClear(obj) {
    var retVal = obj;
    obj = null;
    return retVal;
}

