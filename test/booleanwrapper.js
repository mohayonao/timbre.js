var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("BooleanWrapper", function() {
    it("new", function() {
        assert.equal(T(true).toString(), "BooleanWrapper");
    });
    it("new with value", function() {
        var t = T(true);
        assert.equal(t.value, true);
    });
    it("fixed control-rate", function() {
        var t = T(true);
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("valueOf()", function() {
        var t = T(true, {mul:2, add:5});
        assert.equal(t.valueOf(), 1 * 2 + 5);
    });
    it("cannot accept NaN", function() {
        var t = T(false, {mul:NaN, add:NaN});
        assert.equal(t.valueOf(), 0);
    });
});
