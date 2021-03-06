/*
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
var tuple = require("./boneidle.tuple");
var shared = require("./boneidle.shared");
var option = require("./boneidle.option");
var validity = require("./boneidle.validity");
var either = require("./boneidle.either");
var chain = require("./boneidle.chain");
var queue = require("./boneidle.queue");
var predicates = require("./boneidle.predicates")
var functions = require("./boneidle.functions")

module.exports = sequence;

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

sequence.debug = debug_sequence;
sequence.chain = function (f) {
    return new chain.Chain(f);
}
sequence.range = range;
sequence.option = option;
sequence.validity = validity;
sequence.stream = stream;
sequence.either = either;
sequence.predicates = predicates;
sequence.functions = functions;
sequence.pair = function (first, second) {
    return new tuple.Pair(first, second);
}
sequence.iterators = iterators;
sequence.$ = wrap;


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

function wrap(f) {
    return function () {
        var callback = arguments[arguments.length - 1];
        var newArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
        callback(f.apply(null, newArgs));
    }
}

function Sequence(iterator) {
    var self = this;
    this.map = function (func) {
        return self.map$(wrap(func));
    }
    this.map$ = function (func) {
        return new Sequence(new iterators.MapIterator(iterator, func))
    }
    this.flatMap = function (func) {
        return self.flatMap$(wrap(func));
    }
    this.flatMap$ = function (func) {
        return new Sequence(new iterators.FlatMapIterator(iterator, func));
    }
    this.foldLeft = function (seed, func, callback) {
        return self.foldLeft$(seed, wrap(func), callback);
    }
    this.foldLeft$ = function (seed, func, callback) {
        materialise(seed, iterator, callback, function (seed, iterator, next, callback, action) {
            func(seed, next, function (seed) {
                materialise(seed, iterator, callback, action);
            })
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
        return self.filter$(wrap(predicate));
    }
    this.filter$ = function (predicate) {
        return new Sequence(new iterators.FilterIterator(iterator, predicate));
    }
    this.find = function (predicate, callback) {
        return self.find$(wrap(predicate), callback);
    }
    this.find$ = function (predicate, callback) {
        return shared.firstMatch(iterator, predicate, callback);
    }
    this.realise = function (callback) {
        materialise([], this, callback, function (result, iterator, next, callback, action) {
            result.push(next);
            materialise(result, iterator, callback, action);
        });
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
        self.takeWhile$(wrap(predicate), callback);
    }
    this.takeWhile$ = function (predicate, callback) {
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
        predicate(option.get(), function (matches) {
            if (matches) {
                values.push(option.get());
                takeWhileInternal(sequence, values, predicate, callback);
            } else {
                callback(values);
            }
        })
    });
}

function materialise(result, iterator, callback, action) {
    iterator.hasNext(function (hasNext) {
        if (hasNext) {
            iterator.next(function (next) {
                process.nextTick(function() {
                    action(result, iterator, next, callback, action);
                });
            });
        } else {
            callback(result);
        }
    });
}
