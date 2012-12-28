var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe("ObjectWrapper", function() {
    it("new", function() {
        assert.equal(T({}).toString(), "ObjectWrapper");
    });
});
