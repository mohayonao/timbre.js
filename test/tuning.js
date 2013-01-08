var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var Tuning = timbre.modules.Tuning;
var TuningInfo = timbre.modules.TuningInfo;

describe("timbre.modules.TuningInfo", function() {
    it("et12", function() {
        assert.instanceOf(TuningInfo.at("et12"), Tuning);
    });
    it("just", function() {
        assert.instanceOf(TuningInfo.at("just"), Tuning);
    });
    it("names()", function() {
        assert.deepEqual(TuningInfo.names(), ["et12", "just"]);
    });
    it("choose()", function() {
        assert.instanceOf(TuningInfo.choose(), Tuning);
        assert.isTrue(TuningInfo.choose(function(t) {
            return t.name === "ET12";
        }).equals(TuningInfo.at("et12")));
    });
});

describe("timbre.modules.Tuning", function() {
    it("new", function() {
        assert.instanceOf(new Tuning(), Tuning);
    });
    it("et12", function() {
        assert.isTrue(Tuning.et12().equals(TuningInfo.at("et12")));
    });
    it("just", function() {
        assert.isTrue(Tuning.just().equals(TuningInfo.at("just")));
    });
    it("octaveRatio()", function() {
        assert.equal(Tuning.just().octaveRatio(), 2);
    });
    it("stepsPerOctave()", function() {
        assert.equal(Tuning.just().stepsPerOctave(), 12);
    });
    it("size()", function() {
        assert.equal(Tuning.just().size(), 12);
    });    
    it("tuning()", function() {
        assert.deepEqual(Tuning.just().tuning(), Tuning.just()._tuning);
    });    
    it("semitones()", function() {
        assert.deepEqual(Tuning.just().semitones(), Tuning.just().tuning());
    });
    it("cents()", function() {
        assert.deepEqual(Tuning.just().cents(), Tuning.just().tuning().map(function(x) {
            return x * 100;
        }));
    });
    it("ratios()", function() {
        assert.isArray(Tuning.just().ratios());
    });
    it("at()", function() {
        for (var i = 0; i < 16; ++i) {
            assert.equal(Tuning.just().at(i), Tuning.just().tuning()[i]);
        }
    });
    it("wrapAt()", function() {
        for (var i = 0; i < 16; ++i) {
            assert.equal(Tuning.just().wrapAt(i),
                         Tuning.just().tuning()[i % Tuning.just().size()]);
        }
    });
});
