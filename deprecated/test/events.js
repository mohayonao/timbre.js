var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var EventEmitter = timbre.modules.EventEmitter;

describe("EventEmitter", function() {
    it("new", function() {
        var e = new EventEmitter();
        assert.instanceOf(e, EventEmitter);
    });
    it("new with context", function() {
        var e = new EventEmitter(this);
        assert.equal(e.context, this);
    });
    it("on", function() {
        var e = new EventEmitter();
        var emitted = 0;
        e.on("hello", function() {
            emitted++;
        });
        e.emit("hello");
        e.emit("hello");
        e.emit("hello");
        e.emit("hello");
        assert.equal(emitted, 4);
    });
    it("once", function() {
        var e = new EventEmitter();
        var emitted = 0;
        e.once("hello", function() {
            emitted++;
        });
        e.emit("hello");
        e.emit("hello");
        e.emit("hello");
        e.emit("hello");
        assert.equal(emitted, 1);
    });
    it("off", function() {
        var e = new EventEmitter();
        var emitted = 0;
        var f1 = function() {
            assert(false, "on->foo(1) should not be emitted");
        };
        var f2 = function() {
            assert(false, "on->foo(2) should not be emitted");
        };
        var f3 = function() {
            emitted++;
        };
        e.on("foo", f1);
        e.on("foo", f2);
        e.on("foo", f3);
        e.off("foo", f1);
        e.off("foo", f2);
        assert.equal(e.listeners("foo").length, 1);
        e.emit("foo");
        assert.equal(emitted, 1);
    });
    it("once removeListener", function() {
        var e = new EventEmitter();
        var emitted = 0;
        var f1 = function() {
            assert(false, "once->foo(1) should not be emitted");
        };
        var f2 = function() {
            assert(false, "once->foo(2) should not be emitted");
        };
        var f3 = function() {
            emitted++;
        };
        e.once("foo", f1);
        e.once("foo", f2);
        e.once("foo", f3);
        e.off("foo", f1);
        e.off("foo", f2);
        assert.equal(e.listeners("foo").length, 1);
        e.emit("foo");
        e.emit("foo");
        assert.equal(emitted, 1);
    });
    it("removeAllListeners", function() {
        var e = new EventEmitter();
        var f1 = function() {
            assert(false, "on->foo(1) should not be emitted");
        };
        var f2 = function() {
            assert(false, "on->foo(2) should not be emitted");
        };
        var f3 = function() {
            assert(false, "on->foo(3) should not be emitted");
        };
        e.on("foo", f1);
        e.on("foo", f2);
        e.once("foo", f3);
        e.removeAllListeners("foo");
        assert.equal(e.listeners("foo").length, 0);
        e.emit("foo");
        assert(true);
    });
    it("listeners", function() {
        var e = new EventEmitter();
        var f1 = function() {
            assert(false, "on->foo(1) should not be emitted");
        };
        var f2 = function() {
            assert(false, "on->foo(2) should not be emitted");
        };
        var f3 = function() {
            assert(false, "on->foo(3) should not be emitted");
        };
        e.on("foo", f1);
        e.on("foo", f2);
        e.on("foo", f3);
        var list = e.listeners("foo");
        assert.deepEqual(list, [f1, f2, f3]);
    });
    it("emit with args", function() {
        var e = new EventEmitter();
        var emitted = 0;
        e.on("hello", function(a, b) {
            assert.equal(a, "world");
            assert.equal(b, "!!");
            emitted++;
        });
        e.emit("hello", "world", "!!");
        e.emit("hello", "world", "!!");
        assert.equal(emitted, 2);
    });
    it("emit with context", function() {
        var context = {};
        var e = new EventEmitter(context);
        var emitted = 0;
        e.on("hello", function() {
            assert.equal(this, context)
            emitted++;
        });
        e.emit("hello");
        assert.equal(emitted, 1);
    });
    it("once emit with args", function() {
        var e = new EventEmitter();
        var emitted = 0;
        e.once("hello", function(a, b) {
            assert.equal(a, "world");
            assert.equal(b, "!!");
            emitted++;
        });
        e.emit("hello", "world", "!!");
        e.emit("hello", "world", "!!");
        assert.equal(emitted, 1);
    });
    it("once emit with context", function() {
        var context = {};
        var e = new EventEmitter(context);
        var emitted = 0;
        e.once("hello", function() {
            assert.equal(this, context)
            emitted++;
        });
        e.emit("hello");
        e.emit("hello");
        assert.equal(emitted, 1);
    });
    describe("T-Object", function() {
        it("addListener", function() {
            var emitted = 0;
            var t = T(10).on("bang", function() {
                emitted++;
            });
            var e = new EventEmitter();
            e.on("hello", t);
            e.emit("hello");
            e.emit("hello");
            e.emit("hello");
            e.emit("hello");
            assert.equal(emitted, 4);
        });
        it("once", function() {
            var emitted = 0;
            var t = T(10).on("bang", function() {
                emitted++;
            });
            var e = new EventEmitter();
            e.once("hello", t);
            e.emit("hello");
            e.emit("hello");
            e.emit("hello");
            e.emit("hello");
            assert.equal(emitted, 1);
        });
        it("removeListener", function() {
            var emitted = 0;
            var t1 = T(10).on("bang", function() {
                assert(false, "on->foo(1) should not be emitted");
            });
            var t2 = T(10).on("bang", function() {
                assert(false, "on->foo(2) should not be emitted");
            });
            var t3 = T(10).on("bang", function() {
                emitted++;
            });
            var e = new EventEmitter();
            e.on("foo", t1);
            e.on("foo", t2);
            e.on("foo", t3);
            e.off("foo", t1);
            e.off("foo", t2);
            assert.equal(e.listeners("foo").length, 1);
            e.emit("foo");
            e.emit("foo");
            assert.equal(emitted, 2);
        });
        it("once removeListener", function() {
            var emitted = 0;
            var t1 = T(10).on("bang", function() {
                assert(false, "on->foo(1) should not be emitted");
            });
            var t2 = T(10).on("bang", function() {
                assert(false, "on->foo(2) should not be emitted");
            });
            var t3 = T(10).on("bang", function() {
                emitted++;
            });
            var e = new EventEmitter();
            e.once("foo", t1);
            e.once("foo", t2);
            e.once("foo", t3);
            e.off("foo", t1);
            e.off("foo", t2);
            assert.equal(e.listeners("foo").length, 1);
            e.emit("foo");
            e.emit("foo");
            assert.equal(emitted, 1);
        });
        it("removeAllListeners", function() {
            var t1 = T(10).on("bang", function() {
                assert(false, "on->foo(1) should not be emitted");
            });
            var t2 = T(10).on("bang", function() {
                assert(false, "on->foo(2) should not be emitted");
            });
            var t3 = T(10).on("bang", function() {
                assert(false, "on->foo(3) should not be emitted");
            });
            var e = new EventEmitter();
            e.on("foo", t1);
            e.on("foo", t2);
            e.once("foo", t3);
            e.removeAllListeners("foo");
            assert.equal(e.listeners("foo").length, 0);
            e.emit("foo");
            assert(true);
        });
        it("listeners", function() {
            var e = new EventEmitter();
            var t1 = T(10).on("bang", function() {
                assert(false, "on->foo(1) should not be emitted");
            });
            var t2 = T(10).on("bang", function() {
                assert(false, "on->foo(2) should not be emitted");
            });
            var t3 = T(10).on("bang", function() {
                assert(false, "on->foo(3) should not be emitted");
            });
            e.on("foo", t1);
            e.on("foo", t2);
            e.on("foo", t3);
            var list = e.listeners("foo");
            assert.deepEqual(list, [t1, t2, t3]);
        });
        it("emit with args", function() {
            var emitted = 0;
            var t = T(10).on("bang", function(a) {
                emitted++;
                assert.equal(a, 100);
            });
            var e = new EventEmitter();
            e.on("hello", t);
            e.emit("hello", 100);
            assert.equal(emitted, 1);
        });
        it("emit with context", function() {
            var context = {};            
            var emitted = 0;
            var t = T(10).on("bang", function() {
                assert.notEqual(this, context);
                assert.equal(this, t)
                emitted++;
            });
            var e = new EventEmitter(context);
            e.on("hello", t);
            e.emit("hello");
            assert.equal(emitted, 1);
        });
        it("once emit with args", function() {
            var emitted = 0;
            var t = T(10).on("bang", function(a) {
                emitted++;
                assert.equal(a, 100);
            });
            var e = new EventEmitter();
            e.once("hello", t);
            e.emit("hello", 100);
            e.emit("hello", 200);
            assert.equal(emitted, 1);
        });
        it("once emit with context", function() {
            var context = {};
            var emitted = 0;
            var t = T(10).on("bang", function() {
                assert.notEqual(this, context);
                assert.equal(this, t)
                emitted++;
            });
            var e = new EventEmitter(context);
            e.once("hello", t);
            e.emit("hello");
            e.emit("hello");
            assert.equal(emitted, 1);
        });
    });
});
