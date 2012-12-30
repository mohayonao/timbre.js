var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("ArrayWrapper", function() {
    it("new", function() {
        assert.equal(T([]).toString(), "ArrayWrapper");
    });
    it("fixed control-rate", function() {
        var t = T([]);
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
});
