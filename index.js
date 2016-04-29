var Promise = require("bluebird");

module.exports = Queue;

function defer() {
    var ret = {};
    var promise = new Promise(function(resolve, reject) {
        ret.resolve = resolve;
        ret.reject = reject;
    });
    ret.promise = promise;
    return ret;
}

function Queue() {
    this.pushQueue = [];
    this.popQueue = [];
}

Queue.prototype.push = function(obj) {
    if (this.popQueue.length > 0) {
        return this.popQueue.shift().resolve(obj);
    } else {
        return this.pushQueue.push(obj);
    }
}

Queue.prototype.pop = function() {
    if (this.pushQueue.length > 0) {
        return Promise.resolve(this.pushQueue.shift());
    } else {
        var item = defer();
        this.popQueue.push(item);
        return item.promise;
    }
}

Queue.prototype.resolve = function(res) {
    this.popQueue.forEach(function(item) {
        item.resolve(res);
    });
    this.popQueue = [];
}

Queue.prototype.reject = function(err) {
    this.popQueue.forEach(function(item) {
        item.reject(err);
    })
    this.popQueue = [];
}
