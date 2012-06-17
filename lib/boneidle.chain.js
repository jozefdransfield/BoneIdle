module.exports = {
    Chain:Chain
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
