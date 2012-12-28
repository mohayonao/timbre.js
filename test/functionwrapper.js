var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("FunctionWrapper", function() {
    var ret10 = function(x, y) {
        return x * 10 + y;
    };
    
    it("new", function() {
        assert.equal(T(ret10).toString(), "FunctionWrapper");
    });
    it("new with value", function() {
        var t = T(ret10);
        assert.equal(t.func, ret10);
    });
    it("fixed control-rate", function() {
        var t = T(ret10);
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("bang() return self", function() {
        var t = T(ret10);
        assert.equal(t, t.bang());
    });
    it("bang() change the value", function() {
        var t = T(ret10);
        assert.equal(t.valueOf(), 0);
        t.set({args:[2, 5]}).bang();
        assert.equal(t.valueOf(), 2 * 10 + 5);
    });
    it("bang() with args", function() {
        var t = T(ret10);
        assert.equal(t.valueOf(), 0);
        t.bang(3, 4);
        assert.equal(t.valueOf(), 3 * 10 + 4);
    });
    it("bang() with args and .args", function() {
        var t = T(ret10);
        assert.equal(t.valueOf(), 0);
        t.set({args:4}).bang(3);
        assert.equal(t.valueOf(), 3 * 10 + 4);
    });
    it("cannot accept NaN", function() {
        var t = T(ret10, {mul:NaN, ad:NaN});
        t.set({args:NaN}).bang();
        assert.equal(t.valueOf(), 0);
    });
});
