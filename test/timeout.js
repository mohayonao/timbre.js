var T = require("./timbre.debug.js");
var assert = require("assert");

describe('T(timeout)', function() {
    it("isDefined", function() {
        assert.equal(false, T("timeout").isUndefined);
    });
    it("onEnded", function(done) {
        T("timeout", {timeout:50}).on("ended", function() {
            done();
        }).start();
    });
});
