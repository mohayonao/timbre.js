var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("ArrayWrapper", function() {
    it("new", function() {
        assert.equal(T([]).toString(), "ArrayWrapper");
    });
});
