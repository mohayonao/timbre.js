var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("interval")', function() {
    it("new", function() {
        assert.equal(T("interval").toString(), "IntervalNode");
    });
    it("default properties", function() {
        var t = T("interval");
        assert.equal(t.interval, 1000);
        assert.equal(t.delay   , 1000);
        assert.equal(t.count   ,    0);
        assert.equal(t.timeout, Infinity);
        assert.equal(t.currentTime, 0);
    });
    it("fixed control-rate", function() {
        var t = T("interval");
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("process()", function(done) {
        var count = 0;
        var t = T("interval", {interval:10}, function() {
            count++;
        }, function() {
            count++;
            t.stop();
            assert.equal(count, 2);
            done();
        }).start();
    });
    it("emit 'ended' when timeout", function(done) {
        T("interval", {interval:5, timeout:10}).on("ended", function() {
            done();
        }).start();
    });
    it("bang() reset timer", function(done) {
        var t = T("interval", {interval:50}, function() {
            assert(false);
        }).start();
        var count = 0;
        var tid = setInterval(function() {
            t.bang();
            if (count++ >= 5) {
                t.stop();
                clearInterval(tid);
                done();
            }
        }, 20);
    });
    it("cannot restart with 'deferred' option", function(done) {
        var check = true;
        T("interval", {interval:10, timeout:20, deferred:true}, function() {
            assert(check);
        }).then(function() {
            check = false;
            this.start();
            done();
        }).start();
    });
    if (timbre.envtype === "browser") {
        describe("jQuery", function() {
            it("$.Deferred", function(done) {
                var t = T("interval", {timeout:100, deferred:true});
                $.when(t.promise()).then(function() {
                    done();
                });
                t.start();
            });
        });
    }
    after(function() {
        assert.equal(timbre.isPlaying, false);
    });
});
