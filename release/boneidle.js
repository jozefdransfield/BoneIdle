
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"boneidle.chain": function(exports, require, module) {module.exports = {
    Chain:Chain,
    chain:chain
}

function Chain(f) {
    var funcs = [f];
    this.and = function (f) {
        funcs.unshift(f);
        return this;
    }
    this.call = function (param, callback) {
        nextFunction(param, callback);
    }
    function nextFunction(param, callback) {
        var f = funcs.pop();
        f(param, function (either) {
            if (either.isRight() && funcs.length > 0) {
                nextFunction(param, callback);
            } else {
                callback(either)
            }
        });
    }
}

function chain(f) {
    return new Chain(f);
}
}, "boneidle.either": function(exports, require, module) {module.exports = {
    Either: Either,
    left: left,
    right: right
}

function left(value) {
    return new Either(true, value);
}

function right(value) {
    return new Either(false, value);
}

function Either(isLeft, value) {
    var left, right;
    if (isLeft) {
        left = value;
    } else {
        right = value;
    }
    this.isLeft = function () {
        return isLeft;
    };
    this.isRight = function (value) {
        return !isLeft;
    }
    this.left = function () {
        return left;
    }
    this.right = function () {
        return right;
    }
    this.value = function () {
        if (isLeft) {
            return left;
        } else {
            return right;
        }
    }
}}, "boneidle.iterators": function(exports, require, module) {var nameValue = require("./boneidle.namevalue");
var markers = require("./boneidle.markers");
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
                functionValue(func, value, callback);
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
            callback(new nameValue.NameValue(key, obj[key]));
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

function functionValue(obj, value, callback) {
    if (obj instanceof markers.FunctionWithCallbackWrapper) {
        obj.func(value, callback);
    } else {
        callback(obj(value));
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

}, "boneidle": function(exports, require, module) {/*
 Copyright 2012 Jozef Dransfield Day14 Ltd

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var iterators = require("./boneidle.iterators");
var namevalue = require("./boneidle.namevalue");
var markers = require("./boneidle.markers");
var shared = require("./boneidle.shared");
var option = require("./boneidle.option");
var either = require("./boneidle.either");
var chain = require("./boneidle.chain");
var queue = require("./boneidle.queue");

module.exports = {
    sequence:sequence,
    debug_sequence:debug_sequence,
    range:range,
    option:option,
    stream:stream,
    either:either,
    chain:chain,
    namevalue:namevalue,
    markers:markers,
    iterators:iterators
};

function sequence() {
    if (arguments.length == 0) {
        return new Sequence(new iterators.EmptyIterator());
    } else if (arguments.length == 1) {
        if (arguments[0] instanceof Array) {
            return new Sequence(new iterators.ArrayIterator(arguments[0]));
        } else if (arguments[0] instanceof iterators.Iterator) {
            return new Sequence(arguments[0]);
        } else {
            return new Sequence(new iterators.ObjectIterator(arguments[0]))
        }
    } else {
        return new Sequence(new iterators.ArrayIterator(arguments));
    }
}

function debug_sequence() {
    return new DebugSequence(sequence.apply(null, arguments));
}

function stream(stream) {
    return new Sequence(new iterators.StreamIterator(stream));
}

function range(from, to) {
    return new Sequence(new iterators.RangeIterator(from, to))
}

function DebugSequence(sequence) {
    this.sequence = sequence;
    this.map = function (func) {
        return new DebugSequence(this.sequence.map(func));
    }
    this.flatMap = function (func) {
        return new DebugSequence(this.sequence.flatMap(func))
    }
    this.realise = function (callback) {
        this.sequence.realise.call(this, function (value) {
            console.log("Realise returned", value);
            callback(value);
        });
    }
    this.hasNext = function (callback) {
        this.sequence.hasNext(function (val) {
            console.log("HasNext :", val);
            callback(val);
        });
    }
    this.next = function (callback) {
        this.sequence.next(function (val) {
            console.log("Next :", val);
            callback(val);
        });
    }
}

function Sequence(iterator) {
    var self = this;
    this.map = function (func) {
        return new Sequence(new iterators.MapIterator(iterator, func))
    }
    this.flatMap = function (func) {
        return new Sequence(new iterators.FlatMapIterator(iterator, func));
    }
    this.foldLeft = function (seed, func, callback) {
        materialise(seed, iterator, callback, function (seed, iterator, next, callback, action) {
            if (func instanceof markers.FunctionWithCallbackWrapper) {
                func.func(seed, next, function (seed) {
                    materialise(seed, iterator, callback, action);
                })
            } else {
                seed = func(seed, next);
                materialise(seed, iterator, callback, action);
            }
        });
    }
    this.head = function (callback) {
        iterator.hasNext(function (hasNext) {
            if (hasNext) {
                iterator.next(function (next) {
                    callback(option.some(next));
                });
            } else {
                callback(option.none());
            }
        });
    }
    this.filter = function (predicate) {
        return new Sequence(new iterators.FilterIterator(iterator, predicate));
    }
    this.find = function (predicate, callback) {
        return shared.firstMatch(iterator, predicate, callback);
    }
    this.realise = function (callback) {
        materialise([], this, callback, function (result, iterator, next, callback, action) {
            result.push(next);
            materialise(result, iterator, callback, action);
        });
    }
    this.splitOn = function (predicate) {
        return new Sequence(new SplitOnIterator(iterator, predicate));
    }
    this.take = function (c, callback) {
        var values = [];
        var q = new queue.Queue();
        for (var i = 0; i < c; i++) {
            q.queue(function (next) {
                self.head(function (option) {
                    values.push(option.get());
                    next();
                })
            })
        }
        q.queue(function (next) {
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
        return new Sequence(new iterators.JoinedIterator(sequences));
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


}, "boneidle.markers": function(exports, require, module) {module.exports = {
    FunctionWithCallbackWrapper: FunctionWithCallbackWrapper,
    usingCallback: usingCallback
}
function FunctionWithCallbackWrapper(func) {
    this.func = func;
}

function usingCallback(func) {
    return new FunctionWithCallbackWrapper(func);
}}, "boneidle.namevalue": function(exports, require, module) {module.exports = {
    NameValue: NameValue,
    nameValue: nameValue
}

function NameValue(nameParam, valueParam) {
    var name = nameParam;
    var value = valueParam;
    this.__defineGetter__("name", function () {
        return name;
    });
    this.__defineGetter__("value", function () {
        return value;
    });
}

function nameValue(name, value) {
    return new NameValue(name, value);
}}, "boneidle.option": function(exports, require, module) {module.exports = {
    Option: Option,
    some: some,
    none: none
}

function Option(isEmpty, value) {
    this.isEmpty = function () {
        return isEmpty;
    }
    this.get = function () {
        return value;
    }
    this.getOrNull = function () {
        if (!isEmpty) {
            return value;
        }
        return null;
    }
    this.getOr = function (or) {
        if (isEmpty) {
            return or;
        }
        return value;
    }
}

function some(value) {
    return new Option(false, value);
}

function none() {
    return new Option(true);
}}, "boneidle.queue": function(exports, require, module) {module.exports = {
    Queue: Queue
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
}}, "boneidle.shared": function(exports, require, module) {var markers = require("./boneidle.markers");
var option = require("./boneidle.option");

module.exports = {
    firstMatch:firstMatch
}

function firstMatch(iterator, predicate, callback) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (value) {
                if (predicate instanceof markers.FunctionWithCallbackWrapper) {
                    predicate.func(value, function (passed) {
                        if (passed) {
                            callback(option.some(value));
                        } else {
                            firstMatch(iterator, predicate, callback);
                        }
                    });
                } else {
                    if (predicate(value)) {
                        callback(option.some(value));
                    } else {
                        firstMatch(iterator, predicate, callback);
                    }
                }
            })
        } else {
            callback(option.none());
        }
    });
}}});