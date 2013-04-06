var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("osc")', function() {
    it("new", function() {
        assert.equal(T("osc").toString(), "OscNode");
    });
    it("default is audio-rate", function() {
        assert.isTrue(T("osc").isAr);
    });
    it("accept control-rate", function() {
        assert.isTrue(T("osc").kr().isKr);
    });
    describe("alias", function() {
        var aliases = [
            "sin","cos","pulse","tri","saw","fami","konami",
            "+sin","+pulse","+tri","+saw","square"
        ];
        aliases.forEach(function(name) {
            it(name, function() {
                assert.equal(T(name).toString(), "OscNode");
            });
            var rate = (name[0] === "+") ? "control" : "audio";
            it(name + " is " + rate + " rate", function() {
                assert.equal(T(name).isAr, rate === "audio");
            });
        });
    });
});

var Oscillator = timbre.modules.Oscillator;

describe("Oscillator", function() {
    it("new", function() {
        var osc = new Oscillator();
        assert.instanceOf(osc, Oscillator);
    });
    describe("wavetype", function() {
        var osc = new Oscillator();
        var types = [
            "sin","cos","pulse","tri","saw","fami","konami",
            "wavc(01234567)", "wavb(0033)"
        ];
        types.forEach(function(name) {
            it(name, function() {
                assert.doesNotThrow(function() {
                    osc.setWave(name);
                });
            });
        });
    });
});
