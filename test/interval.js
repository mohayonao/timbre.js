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
        var passed = 0;
        var t = T("interval", {interval:10}, function(count) {
            assert.equal(count, 0);
            passed++;
        }, function(count, timer) {
            assert.equal(count, 0);
            passed++;
            assert.equal(passed, 2);
            t.stop();
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
        });
        T("interval", {interval:10, timeout:200}, function(count) {
            t.bang();
        }).on("ended", function() {
            t.stop();
            this.stop();
            done();
        }).start();
        t.start();
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
