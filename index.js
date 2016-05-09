var Promise = require("bluebird");

module.exports = Channel;

function defer() {
    var ret = {};
    var promise = new Promise(function(resolve, reject) {
        ret.resolve = resolve;
        ret.reject = reject;
    });
    ret.promise = promise;
    return ret;
}

function Channel(limit) {
    this.limit = limit || Number.MAX_VALUE;
    this.queue = []; //store obj
    this.pushQueue = []; //store promise
    this.popQueue = []; //store promise
}

Channel.prototype.push = function(obj) {
    if (this.popQueue.length > 0) {
        this.popQueue.shift().resolve(obj);
        return Promise.resolve();
    } else if (this.queue.length < this.limit) {
        this.queue.push(obj);
        return Promise.resolve();
    } else {
        var q = defer();
        this.pushQueue.push(q);
        return q.promise.then(function() {
            this.queue.push(obj);
        });
    }
}

Channel.prototype.pop = function() {
    if (this.queue.length > 0) {
        var obj = this.queue.shift();
        if (this.pushQueue.length) {
            this.pushQueue.shift().resolve();
        }
        return Promise.resolve(obj);
    } else {
        var q = defer();
        this.popQueue.push(q);
        return q.promise;
    }
}

Channel.prototype.resolve = function(res) {
    this.pushQueue.forEach(function(item) {
        item.resolve(res);
    });
    this.pushQueue = [];
    this.popQueue.forEach(function(item) {
        item.resolve(res);
    });
    this.popQueue = [];
}

Channel.prototype.reject = function(err) {
    this.pushQueue.forEach(function(item) {
        item.reject(err);
    })
    this.pushQueue = [];
    this.popQueue.forEach(function(item) {
        item.reject(err);
    })
    this.popQueue = [];
}
