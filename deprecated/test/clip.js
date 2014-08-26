var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("clip")', function() {
    it("new", function() {
        assert.equal(T("clip").toString(), "ClipNode");
    });
    it("default properties", function() {
        var t = T("clip");
        assert.equal(t.min, -0.8);
        assert.equal(t.max, +0.8);
    });
    it("default is audio-rate", function() {
        assert.isTrue(T("+").isAr);
    });
    it("accept control-rate", function() {
        assert.isTrue(T("+").kr().isKr);
    });
    it(".min", function() {
        var t = T("clip", {min:-2});
        assert.equal(t.min, -2);
    });
    it(".max", function() {
        var t = T("clip", {max:+2});
        assert.equal(t.max, +2);
    });
    it(".minmax", function() {
        var t = T("clip", {minmax:0.5});
        assert.equal(t.min, -0.5);
        assert.equal(t.max, +0.5);
    });
    it("set .min when .max < .min", function() {
        var t = T("clip", {max:-3.0});
        assert.equal(t.min, -3.0);
        assert.equal(t.max, +0.8);
    });
    it("set .max when .max < .min", function() {
        var t = T("clip", {min:+3.0});
        assert.equal(t.min, -0.8);
        assert.equal(t.max, +3.0);
    });
    it("process()", function() {
        var t = T("clip", T("sin", {freq:880}));
        var p = timbre.fn.debug.process(t);
        assert.isFalse(p.isNaN);
        assert.closeTo(p.max, t.max, 1e-5);
        assert.closeTo(p.min, t.min, 1e-5);
    });
});
