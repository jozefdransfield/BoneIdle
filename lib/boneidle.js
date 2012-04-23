var fs = require("fs");

module.exports = {
    sequence:sequence,
    range:range,
    some:some,
    none:none,
    stream:stream
}

function sequence() {
    if (arguments.length == 0) {
        return new Sequence(new EmptyIterator());
    } else if (arguments.length == 1) {
        if (arguments[0] instanceof Array) {
            return new Sequence(new ArrayIterator(arguments[0]));
        } else if (isIterator(arguments[0])) {
            return new Sequence(arguments[0]);
        } else {
            return new Sequence(new ObjectIterator(arguments[0]))
        }
    } else {
        return new Sequence(new ArrayIterator(arguments));
    }
}

function stream(stream) {
    return new Sequence(new StreamIterator(stream));
}

function range(from, to) {
    return new Sequence(new RangeIterator(from, to))
}

function file(file) {
    return new Sequence(new ReadFileIterator(file));
}

function some(value) {
    return new Option(false, value);
}

function none() {
    return new Option(true);
}

function Option(isEmpty, value) {
    this.isEmpty = isEmpty;
    this.value = value;
    this.get = function () {
        return this.value;
    }
    this.getOrNull = function () {
        if (!this.isEmpty) {
            return this.value;
        }
        return null;
    }
    this.getOr = function (value) {
        if (this.isEmpty) {
            return value;
        }
        return value;
    }
}

function Sequence(iterator) {
    var self = this;
    this.map = function (func) {
        return new Sequence(new MapIterator(iterator, func))
    }
    this.foldLeft = function (seed, func, callback) {
        materialise(seed, iterator, callback, function (seed, iterator, next, callback, action) {
            seed = func(seed, next);
            materialise(seed, iterator, callback, action);
        });
    }
    this.head = function (callback) {
        iterator.hasNext(function (hasNext) {
            if (hasNext) {
                iterator.next(function (next) {
                    callback(some(next));
                });
            } else {
                callback(none());
            }
        });
    }
    this.filter = function (predicate) {
        return new Sequence(new FilterIterator(iterator, predicate));
    }
    this.find = function (predicate, callback) {
        return firstMatch(iterator, predicate, callback);
    }
    this.realise = function (callback) {
        materialise([], iterator, callback, function (result, iterator, next, callback, action) {
            result.push(next);
            materialise(result, iterator, callback, action);
        });
    }
    this.splitOn = function (predicate) {
        return new Sequence(new SplitOnIterator(iterator, predicate));
    }
    this.take = function (c, callback) {
        var values = [];
        var queue = new Queue();
        for (var i = 0; i < c; i++) {
            queue.queue(function (next) {
                self.head(function (option) {
                    values.push(option.get());
                    next();
                })
            })
        }
        queue.queue(function (next) {
            callback(values);
        });

    }
    this.takeWhile = function (predicate, callback) {
        takeWhileInternal(self, [], predicate, callback)

    }
    this.join = function () {
        var sequences = [self];
        for (i in arguments) {
           sequences.push(arguments[i])
        }
        return new Sequence(new JoinedIterator(sequences));
    }
    this.hasNext = iterator.hasNext;
    this.next = iterator.next;
}

function takeWhileInternal(sequence, values, predicate, callback) {
    sequence.head(function (option) {
        if (predicate(option.get())) {
            values.push(option.get());
            takeWhileInternal(sequence, values, predicate, callback);
        } else {
            callback(values);
        }
    });
}

function Queue() {
    var self = this;
    this.values = [];
    this.queue = function (func) {
        if (this.values.length > 0) {
            this.values.push(func);
        } else {
            func(this.next);
        }
    }
    this.next = function () {
        if (self.values.length > 0) {
            var func = this.values.pop();
            func();
        }
    }
}

function materialise(result, iterator, callback, action) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (next) {
                action(result, iterator, next, callback, action);
            });
        } else {
            callback(result);
        }
    });
}

function ArrayIterator(array) {
    var i = 0;
    this.hasNext = function (callback) {
        callback(i < array.length);
    }
    this.next = function (callback) {
        callback(array[i++]);
    }
}

function JoinedIterator(sequences) {
    var active = 0;
    this.hasNext = function (callback) {
       findFirstSequenceWithNext(callback)
    }

    function findFirstSequenceWithNext(callback) {
        sequences[active].hasNext(function (hasNext) {
            if (hasNext) {
                callback(true)
            } else {
                if (active < sequences.length-1) {
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
    var keys = Object.keys(obj);
    var arrayIterator = new ArrayIterator(keys);
    this.hasNext = arrayIterator.hasNext;
    this.next = function (callback) {
        arrayIterator.next(function (value) {
            callback(obj[value]);
        });
    }
}

function MapIterator(iterator, func) {
    this.hasNext = iterator.hasNext;
    this.next = function (callback) {
        if (callback) {
            iterator.next(function (value) {
                callback(func(value));
            });
            return;
        }
        return func(iterator.next());
    }
}

function FilterIterator(iterator, predicate) {
    var next;
    this.hasNext = function (callback) {
        firstMatch(iterator, predicate, function (option) {
            next = option;
            if (!option.isEmpty) {
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
    this.hasNext = function () {
        return i <= to;
    }
    this.next = function () {
        return i++;
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

function isIterator(obj) {
    return obj.next && obj.hasNext;
}

function returnAndClear(obj) {
    var retVal = obj;
    obj = null;
    return retVal;
}

function firstMatch(iterator, predicate, callback) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (value) {
                if (predicate(value)) {
                    callback(some(value));
                } else {
                    firstMatch(iterator, predicate, callback);
                }
            })
        } else {
            callback(none());
        }
    });
}