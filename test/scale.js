var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var Scale = timbre.modules.Scale;
var ScaleInfo = timbre.modules.ScaleInfo;
var Tuning = timbre.modules.Tuning;

describe("timbre.modules.ScaleInfo", function() {
    it("major", function() {
        assert.instanceOf(ScaleInfo.at("major"), Scale);
    });
    it("minor", function() {
        assert.instanceOf(ScaleInfo.at("minor"), Scale);
    });
    it("names()", function() {
        assert.deepEqual(ScaleInfo.names(), ["major", "minor"]);
    });
    it("choose()", function() {
        assert.instanceOf(ScaleInfo.choose(), Scale);
        assert.isTrue(ScaleInfo.choose(function(t) {
            return t.name === "Major";
        }).equals(ScaleInfo.at("major")));
    });
});

describe("timbre.modules.Scale", function() {
    it("new", function() {
        assert.instanceOf(new Scale(), Scale);
    });
    it("major", function() {
        assert.isTrue(Scale.major().equals(ScaleInfo.at("major")));
    });
    it("minor", function() {
        assert.isTrue(Scale.minor().equals(ScaleInfo.at("minor")));
    });
    it("size()", function() {
        assert.equal(Scale.minor().size(), 7);
    });
    it("pitchesPerOctave()", function() {
        assert.equal(Scale.minor().pitchesPerOctave(), 12);
    });
    it("stepsPerOctave()", function() {
        assert.equal(Scale.minor().stepsPerOctave(), 12);
    });
    it("get tuning()", function() {
        assert.instanceOf(Scale.major().tuning(), Tuning);
    });
    it("set tuning()", function() {
        var s = Scale.major();
        assert.isFalse(s.tuning().equals(Tuning.just()));
        s.tuning(Tuning.just());
        assert.isTrue(s.tuning().equals(Tuning.just()));
    });
    it("semitones()", function() {
        assert.deepEqual(Scale.major().semitones(), [0,2,4,5,7,9,11]);
        assert.deepEqual(Scale.minor().semitones(), [0,2,3,5,7,8,10]);
    });
    it("cents()", function() {
        assert.deepEqual(Scale.major().cents(), [0,200,400,500,700,900,1100]);
    });
    it("ratios()", function() {
        assert.deepEqual(Scale.major().ratios(), Scale.major()._ratios);
    });
    it("at()", function() {
        var s = Scale.major();
        assert.equal(s.at(0), 0);
        assert.equal(s.at(1), 2);
        assert.equal(s.at(2), 4);
        assert.equal(s.at(3), 5);
        assert.equal(s.at(4), 7);
        assert.equal(s.at(5), 9);
        assert.equal(s.at(6), 11);
        assert.equal(s.at(7), 0);
        assert.equal(s.at(8), 2);
    });
    it("wrapAt()", function() {
        var s = Scale.major();
        assert.equal(s.wrapAt(0), 0);
        assert.equal(s.wrapAt(1), 2);
        assert.equal(s.wrapAt(2), 4);
        assert.equal(s.wrapAt(3), 5);
        assert.equal(s.wrapAt(4), 7);
        assert.equal(s.wrapAt(5), 9);
        assert.equal(s.wrapAt(6), 11);
        assert.equal(s.wrapAt(7), 0);
        assert.equal(s.wrapAt(8), 2);
    });
    it("degreeToFreq()", function() {
        var s = Scale.major();
        assert.equal  (s.degreeToFreq(0, 440), 440);
        assert.closeTo(s.degreeToFreq(1, 440), 493.88330125590, 1e-6);
        assert.closeTo(s.degreeToFreq(2, 440), 554.36526195323, 1e-6);
        assert.closeTo(s.degreeToFreq(3, 440), 587.32953583414, 1e-6);
        assert.closeTo(s.degreeToFreq(4, 440), 659.25511382467, 1e-6);
        assert.closeTo(s.degreeToFreq(5, 440), 739.98884542173, 1e-6);
        assert.closeTo(s.degreeToFreq(6, 440), 830.60939515778, 1e-6);
        assert.equal  (s.degreeToFreq(7, 440), 880);
        assert.closeTo(s.degreeToFreq(8, 440), 987.76660251179, 1e-6);
        assert.closeTo(s.degreeToFreq(1, 440, 1), 987.76660251179, 1e-6);
        assert.closeTo(s.degreeToFreq(1, 440, -1), 246.94165062795, 1e-6);
    });
    it("degreeToRatio()", function() {
        var s = Scale.major();
        assert.equal  (s.degreeToRatio(0), 1);
        assert.closeTo(s.degreeToRatio(1), 1.1224620483089, 1e-6);
        assert.closeTo(s.degreeToRatio(2), 1.2599210498937, 1e-6);
        assert.closeTo(s.degreeToRatio(3), 1.3348398541685, 1e-6);
        assert.closeTo(s.degreeToRatio(4), 1.4983070768743, 1e-6);
        assert.closeTo(s.degreeToRatio(5), 1.6817928305039, 1e-6);
        assert.closeTo(s.degreeToRatio(6), 1.8877486253586, 1e-6);
        assert.equal  (s.degreeToRatio(7), 2);
        assert.closeTo(s.degreeToRatio(8), 2.2449240966177, 1e-6);
        assert.closeTo(s.degreeToRatio(1, 1), 2.2449240966177, 1e-6);
        assert.closeTo(s.degreeToRatio(1, -1), 0.56123102415443, 1e-6);
    });
    it("performDegreeToKey()", function() {
        var s = Scale.major();
        assert.equal(s.performDegreeToKey(0), 0);
        assert.equal(s.performDegreeToKey(1), 2);
        assert.equal(s.performDegreeToKey(2), 4);
        assert.equal(s.performDegreeToKey(3), 5);
        assert.equal(s.performDegreeToKey(4), 7);
        assert.equal(s.performDegreeToKey(5), 9);
        assert.equal(s.performDegreeToKey(6), 11);
        assert.equal(s.performDegreeToKey(7), 12);
        assert.equal(s.performDegreeToKey(8, 1), 3);
        assert.closeTo(s.performDegreeToKey(8, 1, 5), 3.4166666666667, 1e-6);
    });
    it("performKeyToDegree", function() {
        var s = Scale.major();
        assert.equal(s.performKeyToDegree(0), 0);
        assert.equal(s.performKeyToDegree(1), 0.5);
        assert.equal(s.performKeyToDegree(2), 1);
        assert.equal(s.performKeyToDegree(3), 1.5);
        assert.equal(s.performKeyToDegree(4), 2);
        assert.equal(s.performKeyToDegree(5), 3);
        assert.equal(s.performKeyToDegree(6), 3.5);
        assert.equal(s.performKeyToDegree(7), 4);
        assert.equal(s.performKeyToDegree(8), 4.5);
        assert.equal(s.performKeyToDegree(9), 5);
        assert.equal(s.performKeyToDegree(10), 5.5);
        assert.equal(s.performKeyToDegree(11), 6);
        assert.equal(s.performKeyToDegree(12), 7);
    });
});
