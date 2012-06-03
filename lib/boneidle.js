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

(function () {
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

    function chain(f) {
        return new Chain(f);
    }

    function nameValue(name, value) {
        return new NameValue(name, value);
    }

    function NameValue(nameParam, valueParam) {
        var name = nameParam;
        var value = valueParam;
        this.__defineGetter__("name", function() {
            return name;
        });
        this.__defineGetter__("value", function() {
            return value;
        });
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


    function stream(stream) {
        return new Sequence(new StreamIterator(stream));
    }

    function range(from, to) {
        return new Sequence(new RangeIterator(from, to))
    }

    function some(value) {
        return new Option(false, value);
    }

    function none() {
        return new Option(true);
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

    function Sequence(iterator) {
        var self = this;
        this.map = function (func) {
            return new Sequence(new MapIterator(iterator, func))
        }
        this.foldLeft = function (seed, func, callback) {
            materialise(seed, iterator, callback, function (seed, iterator, next, callback, action) {
                if (func instanceof FunctionWithCallbackWrapper) {
                     func.func(seed, next, function(seed) {
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
        var keys = Object.keys(obj);
        var arrayIterator = new ArrayIterator(keys);
        this.hasNext = arrayIterator.hasNext;
        this.next = function (callback) {
            arrayIterator.next(function (key) {
                callback(new NameValue(key, obj[key]));
            });
        }
    }

    function MapIterator(iterator, func) {
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

    function functionValue(obj, value, callback) {
        if (obj instanceof FunctionWithCallbackWrapper) {
             obj.func(value, callback);
        } else {
            callback(obj(value));
        }
    }

    function FilterIterator(iterator, predicate) {
        var next;
        this.hasNext = function (callback) {
            firstMatch(iterator, predicate, function (option) {
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
                    if (predicate instanceof FunctionWithCallbackWrapper) {
                         predicate.func(value, function(passed) {
                             if (passed) {
                                 callback(some(value));
                             } else {
                                 firstMatch(iterator, predicate, callback);
                             }
                         });
                    } else {
                        if (predicate(value)) {
                            callback(some(value));
                        } else {
                            firstMatch(iterator, predicate, callback);
                        }
                    }
                })
            } else {
                callback(none());
            }
        });
    }

    function usingCallback(func) {
        return new FunctionWithCallbackWrapper(func);
    }

    function FunctionWithCallbackWrapper(func) {
        this.func = func;
    }

    var exports = {
        sequence:sequence,
        range:range,
        some:some,
        none:none,
        stream:stream,
        left:left,
        right:right,
        chain:chain,
        nameValue: nameValue,
        usingCallback: usingCallback
    };

    if (typeof module != "undefined" && typeof module.exports != "undefined") {
        module.exports = exports;
    } else {
        window.b_ = exports;
    }

}.call(this));

