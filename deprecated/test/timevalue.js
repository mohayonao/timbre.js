var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("timevalue", function() {
    it("hz", function() {
        assert.equal(T.timevalue("1hz"),  1000);
        assert.equal(T.timevalue("100hz"),  10);
    });
    it("l", function() {
        assert.equal(T.timevalue("bpm120 l4"), 500);
        assert.equal(T.timevalue("bpm240 l4"), 250);
        assert.equal(T.timevalue("bpm60.0 l8"), 500);
        assert.equal(T.timevalue("bpm l4."), 750);
    });
    it("..", function() {
        assert.equal(T.timevalue("bpm 0.1.0"), 500);
        assert.equal(T.timevalue("bpm 0.0.480"), 500);
        assert.equal(T.timevalue("bpm 1.0.0"), 2000);
        assert.equal(T.timevalue("bpm60 0.1.0"), 1000);
        assert.equal(T.timevalue("bpm60 0.0.480"), 1000);
        assert.equal(T.timevalue("bpm30.0 1.0.0"), 8000);
        
    });
    it("secs", function() {
        assert.equal(T.timevalue("10secs"), 10 * 1000);
        assert.equal(T.timevalue("10.5secs"), 10.5 * 1000);
        assert.equal(T.timevalue(".5secs"), 0.5 * 1000);
    });
    it("mins", function() {
        assert.equal(T.timevalue("10mins"), 10 * 60 * 1000);
        assert.equal(T.timevalue("10.5mins"), 10.5 * 60 * 1000);
        assert.equal(T.timevalue(".5mins"), 0.5 * 60 * 1000);
    });
    it("ticks", function() {
        assert.equal(T.timevalue("bpm120 480ticks"), 500);
        assert.equal(T.timevalue("bpm60.0 240ticks"), 500);
    });
    it("samples", function() {
        assert.equal(T.timevalue("1000samples"), 1000 / T.samplerate * 1000);
        assert.equal(T.timevalue("1000samples/20hz"), 1000 / 20 * 1000);
    });
    it("ms", function() {
        assert.equal(T.timevalue("50ms"), 50);
        assert.equal(T.timevalue(".5ms"), 0.5);
    });
});
