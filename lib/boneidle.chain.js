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

module.exports = {
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
