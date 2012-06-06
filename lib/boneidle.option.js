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