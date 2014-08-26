var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("NumberWrapper", function() {
    it("new", function() {
        assert.equal(T(0).toString(), "NumberWrapper");
    });
    it("new with value", function() {
        var t = T(10);
        assert.equal(t.value, 10);
    });
    it("fixed control-rate", function() {
        var t = T(0);
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("valueOf()", function() {
        var t = T(10, {mul:2, add:5});
        assert.equal(t.valueOf(), 10 * 2 + 5);
    });
    it("cannot accept NaN", function() {
        var t = T(NaN, {mul:NaN, add:NaN});
        assert.equal(t.valueOf(), 0);
    });
});
