var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("/")', function() {
    it("new", function() {
        assert.equal(T("/").toString(), "DivNode");
    });
    it("default is control-rate", function() {
        assert.isTrue(T("/").isKr);
    });
    it("accept audio-rate", function() {
        assert.isTrue(T("/").ar().isAr);
    });
    it("process() : ar", function() {
        var sin   = T("cell.sin");
        var pulse = T("cell.pulse", {mul:0.25});
        var tri   = T("cell.tri");
        var t = T("/", sin, pulse, tri).ar();
        var val, cell = t.process(0).cells[0];
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            val = sin.cells[0][i];
            if (pulse.cells[0][i] === 0) {
                val = 0;
            } else {
                val /= pulse.cells[0][i];
            }
            if (tri.cells[0][i] === 0) {
                val = 0;
            } else {
                val /= tri.cells[0][i];
            }
            assert.closeTo(cell[i], val, 1e-6, "index:" + i);
        }
    });
    it("process() : kr", function() {
        var sin   = T("cell.sin");
        var pulse = T("cell.pulse", {mul:0.25});
        var tri   = T("cell.tri");
        var t = T("/", sin, pulse, tri);
        var val, cell = t.process(0).cells[0];
        val = sin.cells[0][0] / pulse.cells[0][0] / tri.cells[0][0];
        assert.closeTo(cell[0], val, 1e-6);
        for (var i = 1, imax = cell.length; i < imax; ++i) {
            assert.equal(cell[0], cell[i]);
        }
    });
});
