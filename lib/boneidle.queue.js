module.exports = {
    Queue: Queue
}

function Queue() {
    var self = this;
    this.values = [];
    this.queue = function (func) {
        if (this.values.length > 0) {
            this.values.push(func);
        } else {
            func(this.next);
        }
    }
    this.next = function () {
        if (self.values.length > 0) {
            var func = this.values.pop();
            func();
        }
    }
}