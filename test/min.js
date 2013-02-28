var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("min")', function() {
    it("new", function() {
        assert.equal(T("min").toString(), "MinNode");
    });
    it("default is audio-rate", function() {
        assert.isTrue(T("min").isAr);
    });
    it("accept control-rate", function() {
        assert.isTrue(T("min").kr().isKr);
    });
    it("process() : ar", function() {
        var sin   = T("cell.sin");
        var pulse = T("cell.pulse", {mul:0.25});
        var tri   = T("cell.tri");
        var t = T("min", sin, pulse, tri);
        var val, cell = t.process(0).cells[0];
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            val = Math.min(sin.cells[0][i], Math.min(pulse.cells[0][i], tri.cells[0][i]));
            assert.closeTo(cell[i], val, 1e-6);
        }
    });
    it("process() : kr", function() {
        var sin   = T("cell.sin");
        var pulse = T("cell.pulse", {mul:0.25});
        var tri   = T("cell.tri");
        var t = T("min", sin, pulse, tri).kr();
        var val, cell = t.process(0).cells[0];
        val = Math.min(sin.cells[0][0], Math.min(pulse.cells[0][0], tri.cells[0][0]));
        assert.closeTo(cell[0], val, 1e-6);
        for (var i = 1, imax = cell.length; i < imax; ++i) {
            assert.equal(cell[0], cell[i]);
        }
    });
});
