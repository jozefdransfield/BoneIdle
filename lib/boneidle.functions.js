module.exports = {
    sum: sum,
    multiplyBy: multiplyBy,
    divideBy: divideBy
}

function sum(seed, i) {
    return seed + i;
}

function multiplyBy(num) {
    return function(i) {
        return i*num;
    }
}

function divideBy(num) {
    return function(i) {
        return i/num;
    }
}

