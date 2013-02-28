var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("mml")', function() {
    it("new", function() {
        assert.equal(T("mml").toString(), "MML");
    });
    describe("mml test", function() {
        it("tone", function(done) {
            var list = [], prev = null;
            var mml  = "t300 l64 o4 cdefgab<c";
            T("mml", {mml:mml}).on("data", function(type, opts) {
                if (type === "noteOn") {
                    list.push(opts.noteNum);
                    prev = opts.noteNum;
                } else if (type === "noteOff") {
                    assert.equal(prev, opts.noteNum);
                }
            }).on("ended", function() {
                this.stop();
                assert.deepEqual(list, [60,62,64,65,67,69,71,72]);
                done();
            }).start();
        });
        it("tone sharp/flat", function(done) {
            var list = [];
            var mml  = "t300 l64 o4 cc+dd+ee-dd-c";
            T("mml", {mml:mml}).on("data", function(type, opts) {
                if (type === "noteOn") {
                    list.push(opts.noteNum);
                }
            }).on("ended", function() {
                this.stop();
                assert.deepEqual(list, [60,61,62,63,64,63,62,61,60]);
                done();
            }).start();
        });
        it("octave", function(done) {
            var list = [];
            var mml  = "t300 l64 o3 c <c >c o5 c";
            T("mml", {mml:mml}).on("data", function(type, opts) {
                if (type === "noteOn") {
                    list.push(opts.noteNum);
                }
            }).on("ended", function() {
                this.stop();
                assert.deepEqual(list, [48, 60, 48, 72]);
                done();
            }).start();
        });
        
    });
    
});
