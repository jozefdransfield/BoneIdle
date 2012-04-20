var fs = require("fs");

module.exports = {
    sequence:sequence,
    range:range,
    some:some,
    none:none,
    file:file
}

function sequence() {
    if (arguments.length == 0) {
        return new Sequence(new EmptyIterator());
    } else if (arguments.length == 1) {
        return new Sequence(new ArrayIterator(arguments[0]));
    } else {
        return new Sequence(new ArrayIterator(arguments));
    }
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
    this.map = function (func) {
        return new Sequence(new MapIterator(iterator, func))
    }
    this.foldLeft = function (seed, func, callback) {
        meh(seed, iterator, func, callback);
    }
    this.head = function (callback) {
        iterator.hasNext(function(err, hasNext) {
            if (hasNext) {
                iterator.next(function (err, next) {
                    callback(null, some(next));
                });
            } else {
                callback(null, none());
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
        materialise([], iterator, callback);
    }
    this.splitOn = function (predicate) {
        return new Sequence(new SplitOnIterator(iterator, predicate));
    }
    this.hasNext = iterator.hasNext;
    this.next = iterator.next;
}

function materialise(result, iterator, callback) {
    iterator.hasNext(function (err, hasNext) {
        if (hasNext) {
            iterator.next(function (err, next) {
                result.push(next);
                materialise(result, iterator, callback);
            });
        } else {
            callback(err, result);
        }
    });
}

function meh(seed, iterator, func, callback) {
    iterator.hasNext(function (err, hasNext) {
        if (hasNext) {
            iterator.next(function (err, next) {
                seed = func(seed, next);
                meh(seed, iterator, func, callback);
            });
        } else {
            callback(err, seed);
        }
    });
}

function ArrayIterator(array) {
    var i = 0;
    this.hasNext = function (callback) {
        callback(null, i < array.length);
    }
    this.next = function (callback) {
        callback(null, array[i++]);
    }
}

function MapIterator(iterator, func) {
    this.hasNext = iterator.hasNext;
    this.next = function (callback) {
        if (callback) {
            iterator.next(function (err, value) {
                callback(null, func(value));
            });
            return;
        }
        return func(iterator.next());
    }
}

function FilterIterator(iterator, predicate) {
    var next;
    this.hasNext = function (callback) {
        firstMatch(iterator, predicate, function(err, option) {
            next = option;
            if (!option.isEmpty) {
                callback(null, true)
            } else {
                callback(null, false)
            }
        });
    }
    this.next = function (callback) {
        if (next) {
            callback(null, returnAndClear(next).get());
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
        callback(null, false);
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
    iterator.hasNext(function(err, hasNext) {
        if (hasNext) {
            iterator.next(function(err, value) {
                if (predicate(value)) {
                    callback(null, some(value));
                } else {
                    firstMatch(iterator, predicate, callback);
                }
            })
        } else {
            callback(null, none());
        }
    });
}

function ReadFileIterator(file) {
    var _data;
    var _err;
    this.hasNext = function (callback) {
        if (!_data) {
            readFile(file, callback);
            return;
        }
        callback(null, false);
    }
    this.next = function (callback) {
        if (_data) {
            callback(null, returnAndClear(_data));
            return;
        }
        readFile(file, callback);

    }
    function readFile(file, callback) {
        fs.readFile(file, function (err, data) {
            _err = err;
            _data = data.toString();
            if (data) {
                callback(err, true);
            } else {
                callback(err, false);
            }
        });
    }

}





