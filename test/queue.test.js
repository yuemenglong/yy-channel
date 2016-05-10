var should = require("should");
var Promise = require("bluebird");
var _ = require("lodash");

var Channel = require("..");

describe('Channel', function() {
    it('Push Then Pop', function(done) {
        var channel = new Channel();
        channel.push(1);
        channel.push(2);
        channel.pop().then(function(res) {
            res.should.eql(1);
        }).done();
        channel.pop().then(function(res) {
            res.should.eql(2);
            done();
        }).done();
    });
    it('Pop Then Push', function(done) {
        var channel = new Channel();
        channel.pop().then(function(res) {
            res.should.eql(1);
        }).done();
        channel.pop().then(function(res) {
            res.should.eql(2);
            done();
        }).done();
        channel.push(1);
        channel.push(2);
    });
    it('Pop Nothing', function(done) {
        var channel = new Channel();
        channel.pop().timeout(1000).then(function() {
            should(true).eql(false);
        }).catch(function(err) {
            done();
        }).done();
    });
    it("Push Limit", function(done) {
        var channel = new Channel(10);
        var arr = _.range(10);
        Promise.each(arr, function(item) {
            return channel.push(item).timeout(10).catch(function(err) {
                should(true).eql(false);
            });
        }).then(function() {
            return channel.push(10).timeout(10);
        }).then(function() {
            should(true).eql(false);
        }).catch(function(err) {
            err.name.should.eql("TimeoutError");
        }).done(function() {
            done();
        })
    })
    it("Push Limit2", function(done) {
        var channel = new Channel(1);
        var arr = _.range(10);
        Promise.try(function() {
            return _.range(10).map(function(item) {
                channel.push(item).done();
            })
        }).then(function() {
            return Promise.each(_.range(channel.length()), function(item) {
                return channel.pop().then(function(res) {
                    res.should.eql(item);
                })
            });
        }).done(function() {
            done();
        })
    })
    it("Random Push And Pop", function(done) {
        this.timeout(100 * 1000);
        var channel = new Channel(3);
        var times = 1000;

        function push(i) {
            if (i > times) {
                return Promise.resolve();
            }
            var delay = _.random(1, 50);
            return Promise.delay(delay).then(function() {
                channel.push(i).done(function() {
                    console.log("Push " + i);
                });
                return push(i + 1);
            })
        }

        function pop(i) {
            var delay = _.random(1, 50);
            return Promise.delay(delay).then(function() {
                channel.pop().done(function(res) {
                    res.should.eql(i);
                    console.log("Pop " + res);
                    if (res >= times) {
                        done();
                    }
                });
                return pop(i + 1);
            })
        }
        push(0);
        pop(0);

    })
});
