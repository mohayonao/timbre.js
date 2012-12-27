var T = require("..");
var assert = require("assert");

var Deferred = timbre.modules.Deferred;

describe("Deferred", function() {
    it("resolve()", function(done) {
        var dfd = new Deferred();
        var i = 0;
        dfd.then(function(x, y) {
            i += 1;
            assert.equal(i, 1);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }, function() {
            assert(false);
        }).done(function(x, y) {
            i += 1;
            assert.equal(i, 2);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }, function(x, y) {
            i += 1;
            assert.equal(i, 3);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).fail(function() {
            assert(false);
        }).always(function(x, y) {
            i += 1;
            assert.equal(i, 4);
            assert.equal(x, 10);
            assert.equal(y, 20);
            done();
        });
        dfd.resolve(10, 20);
    });
    it("reject()", function(done) {
        var dfd = new Deferred();
        var i = 0;
        dfd.then(function() {
            assert(false);
        }, function(x, y) {
            i += 1;
            assert.equal(i, 1);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).done(function() {
            assert(false);
        }).fail(function(x, y) {
            i += 1;
            assert.equal(i, 2);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }, function(x, y) {
            i += 1;
            assert.equal(i, 3);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).always(function(x, y) {
            i += 1;
            assert.equal(i, 4);
            assert.equal(x, 10);
            assert.equal(y, 20);
            done();
        });
        dfd.reject(10, 20);
    });
    it("resolveWith()", function(done) {
        var dfd = new Deferred();
        var a = {};
        dfd.then(function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).done(function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).fail(function() {
            assert(false);
        }).always(function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
            done();
        });
        dfd.resolveWith(a, 10, 20);
    });
    it("rejectWith()", function(done) {
        var dfd = new Deferred();
        var a = {};
        dfd.then(null, function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).done(function() {
            assert(false);
        }).fail(function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
        }).always(function(x, y) {
            assert.equal(this, a);
            assert.equal(x, 10);
            assert.equal(y, 20);
            done();
        });
        dfd.rejectWith(a, 10, 20);
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
        var wait = T("wait");
        assert.equal(wait, wait.then());
    });
    it("done should return self", function() {
        var wait = T("wait");
        assert.equal(wait, wait.done());
    });
    it("fail should return self", function() {
        var wait = T("wait");
        assert.equal(wait, wait.fail());
    });
    it("always should return self", function() {
        var wait = T("wait");
        assert.equal(wait, wait.always());
    });
    it("promise", function(done) {
        var wait = T("wait", {timeout:100});
        wait.promise().then(function() {
            assert(true);
            done();
        }, function() {
            assert(false);
        }).done(function() {
            assert(true);
        }).fail(function() {
            assert(false);
        });
        wait.start();
    });
    it("pipe", function(done) {
        var wait = T("wait", {timeout:100});
        wait.pipe(function() {
            return 100;
        }).then(function(x) {
            assert.equal(x, 100);
            done();
        });
        wait.start();
    });
});
