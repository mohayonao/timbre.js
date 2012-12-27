var T = require("..");
var assert = require("assert");

describe('T("wait")', function() {
    it("isDefined", function() {
        assert.equal(false, T("wait").isUndefined);
    });
    it("work", function(done) {
        T("wait", {timeout:10}).then(function() {
            assert(true);
            done();
        }).start();
    });
    it("this is self when callback(resolve)", function(done) {
        var wait = T("wait", {timeout:10}).then(function() {
            assert.equal(this, wait);
            done();
        }).start();
    });
    it("this is self when callback(reject)", function(done) {
        var wait = T("wait", {timeout:1000}).then(function() {
            assert(false);
        }).fail(function() {
            assert.equal(this, wait);
            done();
        }).start();
        setTimeout(function() {
            wait.stop();
        }, 100);
    });
    it("zero time stop", function(done) {
        T("wait", {timeout:1000}).then(function() {
        }, function() {
            assert(true);
            done();
        }).start().stop();
    });
});
