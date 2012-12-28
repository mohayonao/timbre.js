var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var Deferred = timbre.modules.Deferred;

describe("Deferred", function() {
    it("resolve()", function() {
        var dfd = new Deferred();
        var i = 0;
        dfd.then(function() {
            i++;
        }, function() {
            assert(false);
        }).done(function() {
            i++;
        }, function() {
            i++;
        }).fail(function() {
            assert(false);
        }).always(function() {
            i++;
        });
        after(function() {
            assert.equal(i, 4);
        });
        dfd.resolve();
    });
    it("reject()", function() {
        var dfd = new Deferred();
        var i = 0;
        dfd.then(function() {
            assert(false);
        }, function(x, y) {
            i++;
        }).done(function() {
            assert(false);
        }).fail(function(x, y) {
            i++;
        }, function(x, y) {
            i++;
        }).always(function(x, y) {
            i++;
        });
        after(function() {
            assert.equal(i, 4);
        });
        dfd.reject(10, 20);
    });
    it("resolveWith()", function() {
        var dfd = new Deferred();
        var a = {};
        dfd.then(function() {
            assert.equal(this, a);
        }).done(function() {
            assert.equal(this, a);
        }).fail(function() {
            assert(false);
        }).always(function() {
            assert.equal(this, a);
        });
        dfd.resolveWith(a);
    });
    it("rejectWith()", function() {
        var dfd = new Deferred();
        var a = {};
        dfd.then(null, function() {
            assert.equal(this, a);
        }).done(function() {
            assert(false);
        }).fail(function() {
            assert.equal(this, a);
        }).always(function() {
            assert.equal(this, a);
        });
        dfd.rejectWith(a);
    });
    it("pipe()", function(done) {
        var dfd = new Deferred(), dfd2;
        dfd.pipe(function(x) {
            assert.equal(x, 10);
            assert.equal(this, dfd);
            return 20;
        }).pipe(function(x) {
            assert.equal(x, 20);
            assert.equal(this, dfd);
            dfd2 = new Deferred();
            dfd2.name = "dfd2";
            setTimeout(function() {
                console.log("dfd2.resolve(30)");
                dfd2.resolve(30);
            }, 150);
            return dfd2.promise();
        }).pipe(function(x) {
            assert.equal(x, 30);
            // assert.equal(this, dfd2);
            done();
        });
        dfd.resolve(10);
    });
    it("pipe === then");
});

describe("Deferred T-Object", function() {
    it("then should return self", function() {
        var timeout = T("timeout", {once:true});
        assert.equal(timeout, timeout.then());
    });
    it("done should return self", function() {
        var timeout = T("timeout", {once:true});
        assert.equal(timeout, timeout.done());
    });
    it("fail should return self", function() {
        var timeout = T("timeout", {once:true});
        assert.equal(timeout, timeout.fail());
    });
    it("always should return self", function() {
        var timeout = T("timeout", {once:true});
        assert.equal(timeout, timeout.always());
    });
    it("promise", function(done) {
        var timeout = T("timeout", {once:true, timeout:100});
        timeout.promise().then(function() {
            assert(true);
            done();
        }, function() {
            assert(false);
        }).done(function() {
            assert(true);
        }).fail(function() {
            assert(false);
        });
        timeout.start();
    });
    it("pipe", function(done) {
        var timeout = T("timeout", {once:true, timeout:100});
        timeout.pipe(function() {
            return 100;
        }).then(function(x) {
            assert.equal(x, 100);
            done();
        });
        timeout.start();
    });
});
