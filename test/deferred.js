var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var Deferred = timbre.modules.Deferred;

if (!true) {
    Deferred = $.Deferred;
}

describe("Deferred", function() {
    it.skip("new", function() {
        var dfd = new Deferred();
        assert.instanceOf(dfd, Deferred);
    });
    it("resolve()", function() {
        var dfd = new Deferred();
        var passed = 0;
        dfd.then(function() {
            passed++;
        }, function() {
            assert(false);
        }).done(function() {
            passed++;
        }, function() {
            passed++;
        }).fail(function() {
            assert(false);
        }).always(function() {
            passed++;
        });
        dfd.resolve();
        dfd.resolve();
        dfd.reject();
        assert.equal(passed, 4);
        assert.equal(dfd.state(), "resolved");
        assert.isTrue(dfd.isResolved());
    });
    it("fail()", function() {
        var dfd = new Deferred();
        var passed = 0;
        dfd.then(function() {
            assert(false);
        }, function() {
            passed++;            
        }).done(function() {
            assert(false);
        }).fail(function() {
            passed++;
        }, function() {
            passed++;
        }).always(function() {
            passed++;
        });
        dfd.reject();
        dfd.reject();
        dfd.resolve();
        assert.equal(dfd.state(), "rejected");
        assert.equal(passed, 4);
    });
    it("pipe()", function() {
        var dfd = new Deferred();
        var passed = 0;
        dfd.pipe(function(x) {
            assert.equal(x, 0);
            passed++;
            return 10;
        }).pipe(function(x) {
            assert.equal(x, 10);
            passed++;
            return 20;
        }).pipe(function(x) {
            assert.equal(x, 20);
            passed++
        });
        dfd.resolve(0);
        dfd.resolve(0);
        assert.equal(passed, 3);
    });
    it("pipe() with deferred", function(done) {
        var dfd = new Deferred();
        var passed  = 0;
        dfd.pipe(function() {
            passed++;
            return 10;
        }).pipe(function(x) {
            var dfd2 = new Deferred();
            dfd2.then(function(x) {
                assert.equal(x, 20);
                passed++;
            });
            setTimeout(function() {
                dfd2.resolve(20);
            }, 10);
            return dfd2;
        }).pipe(function(x) {
            assert.equal(passed, 2);
            assert.equal(x, 20);
            done();
        });
        dfd.resolve();
        dfd.resolve();
    });
    it.skip("pipe() context", function(done) {
        var dfd = new Deferred(), dfd2;
        var passed  = 0;
        dfd.pipe(function() {
            assert.equal(this, dfd);
            passed++;
        }).pipe(function() {
            assert.notEqual(this, dfd);
            dfd2 = new Deferred();
            dfd2.then(function() {
                passed++;
            });
            setTimeout(function() {
                dfd2.resolve();
            }, 10);
            return dfd2;
        }).pipe(function() {
            assert.equal(this, dfd2);
            assert.equal(passed, 2);
            done();
        });
        dfd.resolve();
        dfd.resolve();
    });
});
