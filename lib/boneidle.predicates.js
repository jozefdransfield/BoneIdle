
module.exports = {
    isBlank: isBlank,
    even: even,
    odd: odd,
    not: not,
    lessThan: lessThan,
    greaterThan: greaterThan,
    equals: equals
}


function isBlank(value) {
    return (!value || value.length == 0);
}

function even(value) {
    return value % 2 == 0;
}

function odd(value) {
    return value % 2 != 0;
}

function not(f) {
    return function(value) {
        return !f(value)
    };
}

function lessThan(num) {
    return function(i) {
        return i < num;
    }
}

function greaterThan(num) {
    return function(i) {
        return i > num;
    }
}

function equals(obj) {
    return function(value) {
        return obj == value;
    }
}
