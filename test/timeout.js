var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("timeout")', function() {
    it("new", function() {
        assert.equal(T("timeout").toString(), "TimeoutNode");
    });
    it("default properties", function() {
        var t = T("timeout");
        assert.equal(t.timeout,  1000);
        assert.equal(t.currentTime, 0);
    });
    it("fixed control-rate", function() {
        var t = T("timeout");
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("process() / emit 'ended' when timeout", function(done) {
        T("timeout", {timeout:100}).on("ended", function() {
            this.stop();
            done();
        }).start();
    });
    it("bang() reset timer", function(done) {
        var t = T("timeout", {timeout:50}, function() {
            assert(false);
        }).start();
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
