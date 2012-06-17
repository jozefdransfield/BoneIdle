module.exports = {
    Pair: Pair
}

function Pair(first, second) {
    this.__defineGetter__('first', function(){
        return first;
    });
    this.__defineGetter__('second', function(){
        return second;
    });
}
