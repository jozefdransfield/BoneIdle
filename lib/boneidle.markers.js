module.exports = {
    FunctionWithCallbackWrapper: FunctionWithCallbackWrapper,
    usingCallback: usingCallback
}
function FunctionWithCallbackWrapper(func) {
    this.func = func;
}

function usingCallback(func) {
    return new FunctionWithCallbackWrapper(func);
}