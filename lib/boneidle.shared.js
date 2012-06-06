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

var markers = require("./boneidle.markers");
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
}