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
}