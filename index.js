var Promise = require("bluebird");

module.exports = Channel;

function defer(obj) {
    var ret = { obj: obj };
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
    this.pushQueue = []; //store promise: now there is no room, resolve me when have
    this.popQueue = []; //store promise: now there is no item, resolve me when have
}

Channel.prototype.length = function() {
    return this.queue.length + this.pushQueue.length;
}

Channel.prototype.push = function(obj) {
    if (this.popQueue.length > 0) {
        this.popQueue.shift().resolve(obj);
        return Promise.resolve();
    } else if (this.queue.length < this.limit) {
        this.queue.push(obj);
        return Promise.resolve();
    } else {
        var q = defer(obj);
        this.pushQueue.push(q);
        return q.promise;
    }
}

Channel.prototype.pop = function() {
    if (this.queue.length > 0) {
        var obj = this.queue.shift();
        if (this.pushQueue.length) {
            var q = this.pushQueue.shift();
            this.queue.push(q.obj);
            q.resolve();
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
