var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("interval")', function() {
    it("new", function() {
        assert.equal(T("interval").toString(), "IntervalNode");
    });
    it("default properties", function() {
        var t = T("interval");
        assert.equal(t.interval, 1000);
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
            this.stop();
            done();
        }).start();
    });
    it("bang() reset timer", function(done) {
        var t = T("interval", {delay:50, interval:50}, function() {
            assert(false, "not reset?");
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
    after(function() {
        assert.equal(timbre.isPlaying, false);
    });
});
