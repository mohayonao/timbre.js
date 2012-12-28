var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("+")', function() {
    it("new", function() {
        assert.equal(T("+").toString(), "PlusNode");
    });
    it("default is audio-rate", function() {
        assert.isTrue(T("+").isAr);
    });
    it("accept control-rate", function() {
        assert.isTrue(T("+").kr().isKr);
    });
    it("process()", function() {
        var a = T(10), b = T(20);
        var t = T("+", a, b);
        assert.equal(t.valueOf(), 10 + 20);
    });
    it("process() with .mul", function() {
        var a = T(10), b = T(20);
        var t = T("+", {mul:5}, a, b);
        assert.equal(t.valueOf(), (10 + 20) * 5);
    });
    it("process() with .add", function() {
        var a = T(10), b = T(20);
        var t = T("+", {add:5}, a, b);
        assert.equal(t.valueOf(), (10 + 20) + 5);
    });
});
