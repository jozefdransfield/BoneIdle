module.exports = {
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
}