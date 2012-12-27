var T = require("..");
var assert = require("assert");

describe('T("timeout")', function() {
    it("isDefined", function() {
        assert.equal(false, T("timeout").isUndefined);
    });
    it("work", function(done) {
        T("timeout", {once:true,timeout:10}).then(function() {
            assert(true);
            done();
        }).start();
    });
    it("this is self when callback(resolve)", function(done) {
        var timeout = T("timeout", {once:true,timeout:10}).then(function() {
            assert.equal(this, timeout);
            done();
        }).start();
    });
    it("this is self when callback(reject)", function(done) {
        var timeout = T("timeout", {once:true,timeout:1000}).then(function() {
            assert(false);
        }).fail(function() {
            assert.equal(this, timeout);
            done();
        }).start();
        setTimeout(function() {
            timeout.stop();
        }, 100);
    });
    it("zero time stop", function(done) {
        T("timeout", {once:true,timeout:1000}).then(function() {
        }, function() {
            assert(true);
            done();
        }).start().stop();
    });
});
