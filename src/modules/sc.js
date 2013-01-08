(function() {
    "use strict";
    
    // LOCAL METHODS
    var midiratio = function(list) {
        var a = new Array(list.length);
        for (var i = a.length; i--; ) {
            a[i] = Math.pow(2, list[i] * 1/12);
        }
        return a;
    };
    var ratiomidi = function(list) {
        var a = new Array(list.length);
        for (var i = a.length; i--; ) {
            a[i] = Math.log(list[i] < 0 ? -list[i] : list[i]) * Math.LOG2E * 12;
        }
        return a;
    };
    var wrapAt = function(list, index) {
        index |= 0;
        if (index < 0) {
            return list[list.length + (index + 1) % list.length - 1];
        } else {
            return list[index % list.length];
        }
    };
    var equals = function(list1, list2) {
        if (list1.length !== list2.length) {
            return false;
        }
        for (var i = list1.length; i--; ) {
            if (list1[i] !== list2[i]) {
                return false;
            }
        }
        return true;
    };
    var performKeyToDegree = function(list, degree, stepsPerOctave) {
        if (typeof stepsPerOctave !== "number") {
            stepsPerOctave = 12;
        }
        var n = ((degree / stepsPerOctave)|0) * list.length;
        var key = degree % stepsPerOctave;
        return indexInBetween(list, key) + n;
    };
    var indexIn = function(list, val) {
        var j = indexOfGreaterThan(list, val);
        if (j === -1) {
            return list.length - 1;
        }
        if (j ===  0) {
            return j;
        }
        var i = j - 1;
        return ((val - list[i]) < (list[j] - val)) ? i : j;
    };
    var indexInBetween = function(list, val) {
        var i = indexOfGreaterThan(list, val);
        if (i === -1) {
            return list.length - 1;
        }
        if (i ===  0) {
            return i;
        }
        var a = list[i-1], b = list[i], div = b - a;
        if (div === 0) {
            return i;
        }
        return ((val - a) / div) + i - 1;
    };
    var indexOfGreaterThan = function(list, val) {
        for (var i = 0, imax = list.length; i < imax; ++i) {
            if (list[i] > val) {
                return i;
            }
        }
        return -1;
    };
    var performNearestInList = function(list, degree) {
        return list[indexIn(list, degree)];
    };
    var performNearestInScale = function(list, degree, stepsPerOctave) {
        if (typeof stepsPerOctave !== "number") {
            stepsPerOctave = 12;
        }
        var root = trunc(degree, stepsPerOctave);
        var key  = degree % stepsPerOctave;
        return nearestInList(key, list) + root;
    };
    var trunc = function(x, quant) {
        return quant === 0 ? x : Math.floor(x / quant) * quant;
    };
    var nearestInList = function(degree, list) {
        return list[indexIn(list, degree)];
    };
    
    
    
    (function() {
        function Tuning(tuning, octaveRatio, name) {
            if (!Array.isArray(tuning)) {
                tuning = [0,1,2,3,4,5,6,7,8,9,10,11];
            }
            if (typeof octaveRatio !== "number") {
                octaveRatio = 2;
            }
            if (typeof name !== "string") {
                name = "Unknown Tuning";
            }
            this._tuning      = tuning;
            this._octaveRatio = octaveRatio;
            this.name = name;
        }
        
        var $ = Tuning.prototype;
        
        $.semitones = function() {
            return this._tuning.slice(0);
        };
        $.cents = function() {
            return this._tuning.slice(0).map(function(x) {
                return x * 100;
            });
        };
        $.ratios = function() {
            return midiratio(this._tuning);
        };
        $.at = function(index) {
            return this._tuning[index];
        };
        $.wrapAt = function(index) {
            return wrapAt(this._tuning, index);
        };
        $.octaveRatio = function() {
            return this._octaveRatio;
        };
        $.size = function() {
            return this._tuning.length;
        };
        $.stepsPerOctave = function() {
            return Math.log(this._octaveRatio) * Math.LOG2E * 12;
        };
        $.tuning = function() {
            return this._tuning;
        };
        $.equals = function(argTuning) {
            return this._octaveRatio === argTuning._octaveRatio &&
                equals(this._tuning, argTuning._tuning);
        };
        $.deepCopy = function() {
            return new Tuning(this._tuning.slice(0),
                              this._octaveRatio,
                              this.name);
        };
        
        // CLASS METHODS
        Tuning.et = function(pitchesPerOctave) {
            if (typeof pitchesPerOctave !== "number") {
                pitchesPerOctave = 12;
            }
            return new Tuning(Tuning.calcET(pitchesPerOctave),
                              2,
                              Tuning.etName(pitchesPerOctave));
        };
        
        Tuning.choose = function(size) {
            if (typeof size !== "number") {
                size = 12;
            }
            return TuningInfo.choose(
                function(x) { return x.size() === size; }
            );
        };
        
        Tuning["default"] = function(pitchesPerOctave) {
            return Tuning.et(pitchesPerOctave);
        };
        
        Tuning.calcET = function(pitchesPerOctave) {
            var a = new Array(pitchesPerOctave);
            for (var i = a.length; i--; ) {
                a[i] = i * (12 / pitchesPerOctave);
            }
            return a;
        };
        
        Tuning.etName = function(pitchesPerOctave) {
            return "ET" + pitchesPerOctave;
        };
        
        
        // TuningInfo
        var TuningInfo = (function() {
            var TuningInfo = {};
            var tunings = {};
            
            TuningInfo.choose = function(selectFunc) {
                var candidates = [];
                var keys = Object.keys(tunings);
                var t;
                for (var i = keys.length; i--; ) {
                    t = tunings[keys[i]];
                    if (typeof selectFunc !== "function" || selectFunc(t)) {
                        candidates.push(t);
                    }
                }
                t = candidates[(Math.random() * candidates.length)|0];
                if (t) {
                    return t.deepCopy();
                }
            };
            TuningInfo.at = function(key) {
                var t = tunings[key];
                if (t) {
                    return t.deepCopy();
                }
            };
            TuningInfo.names = function() {
                var keys = Object.keys(tunings);
                keys.sort();
                return keys;
            };
            TuningInfo.register = function(key, tuning) {
                if (typeof key === "string" && tuning instanceof Tuning) {
                    tunings[key] = tuning;
                    Tuning[key] = (function(key) {
                        return function() {
                            return TuningInfo.at(key).deepCopy();
                        };
                    }(key));
                }
            };
            return TuningInfo;
        })();
        
        
        TuningInfo.register(
            "et12", new Tuning(([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
            ]), 2, "ET12")
        );
        TuningInfo.register(
            "just", new Tuning(ratiomidi([
                1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8
            ]), 2, "Limit Just Intonation")
        );
        
        timbre.modules.Tuning = Tuning;
        timbre.modules.TuningInfo = TuningInfo;
    })();
    
    
    
    (function() {
        function Scale(degrees, pitchesPerOctave, tuning, name) {
            if (!Array.isArray(degrees)) {
                degrees = [0,2,4,5,7,9,11]; // ionian
            }
            if (typeof pitchesPerOctave !== "number") {
                pitchesPerOctave = Scale.guessPPO(degrees);
            }
            var _name;
            if (typeof tuning === "string") {
                _name = tuning;
                tuning = timbre.modules.TuningInfo.at(tuning);
            }
            if (!(tuning instanceof timbre.modules.Tuning)) {
                tuning = timbre.modules.Tuning["default"](pitchesPerOctave);
            }
            if (name === undefined) {
                name = _name;
            }
            if (typeof name !== "string") {
                name = "Unknown Scale";
            }

            this.name = name;
            this._degrees = degrees;
            this._pitchesPerOctave = pitchesPerOctave;
            this.tuning(tuning);
        }

        var $ = Scale.prototype;
        
        $.tuning = function(inTuning) {
            if (inTuning === undefined) {
                return this._tuning;
            }
            if (typeof inTuning === "string") {
                inTuning = timbre.modules.TuningInfo.at(inTuning);
            }
            if (!(inTuning instanceof timbre.modules.Tuning) ) {
                console.warn("The first argument must be instance of Tuning");
                return;
            }
            if (this._pitchesPerOctave !== inTuning.size()) {
                console.warn("Scale steps per octave " + this._pitchesPerOctave + " does not match tuning size ");
                return;
            }
            this._tuning = inTuning;
            this._ratios = midiratio(this.semitones());
            
            return inTuning;
        };
        $.semitones = function() {
            return this._degrees.map(this._tuning.wrapAt.bind(this._tuning));
        };
        $.cents = function() {
            return this.semitones().map(function(x) {
                return x * 100;
            });
        };
        $.ratios = function() {
            return this._ratios;
        };
        $.size = function() {
            return this._degrees.length;
        };
        $.pitchesPerOctave = function() {
            return this._pitchesPerOctave;
        };
        $.stepsPerOctave = function() {
            return Math.log(this.octaveRatio()) * Math.LOG2E * 12;
        };
        $.at = function(index) {
            return this._tuning.at(wrapAt(this._degrees, index));
        };
        $.wrapAt = function(index) {
            return this._tuning.wrapAt(wrapAt(this._degrees, index));
        };
        $.degreeToFreq = function(degree, rootFreq, octave) {
            return this.degreeToRatio(degree, octave) * rootFreq;
        };
        $.degreeToRatio = function(degree, octave) {
            if (typeof octave !== "number") {
                octave = 0;
            }
            octave += (degree / this._degrees.length)|0;
            return wrapAt(this.ratios(), degree) * Math.pow(this.octaveRatio(), octave);
        };
        $.checkTuningForMismatch = function(aTuning) {
            return this._pitchesPerOctave === aTuning.size();
        };
        $.degrees = function() {
            return this._degrees;
        };
        $.guessPPO = function() {
            return Scale.guessPPO(this._degrees);
        };
        $.octaveRatio = function() {
            return this._tuning.octaveRatio();
        };
        $.performDegreeToKey = function(scaleDegree, stepsPerOctave, accidental) {
            if (typeof stepsPerOctave !== "number") {
                stepsPerOctave = this.stepsPerOctave();
            }
            if (typeof accidental !== "number") {
                accidental = 0;
            }
            var basekey = this.wrapAt(scaleDegree);
            basekey += stepsPerOctave * ((scaleDegree / this.size())|0);
            if (accidental === 0) {
                return basekey;
            } else {
                return basekey + (accidental * (stepsPerOctave / 12));
            }
        };
        $.performKeyToDegree = function(degree, stepsPerOctave) {
            if (typeof stepsPerOctave !== "number") {
                stepsPerOctave = 12;
            }
            return performKeyToDegree(this._degrees, degree, stepsPerOctave);
        };
        $.performNearestInList = function(degree) {
            return performNearestInList(this._degrees, degree);
        };
        $.performNearestInScale = function(degree, stepsPerOctave) {
            if (typeof stepsPerOctave !== "number") {
                stepsPerOctave = 12;
            }
            return performNearestInScale(this._degrees, degree, stepsPerOctave);
        };
        $.equals = function(argScale) {
            return equals(this.degrees(), argScale.degrees()) &&
                this._tuning.equals(argScale._tuning);
        };
        $.deepCopy = function() {
            return new Scale(this._degrees.slice(0),
                             this._pitchesPerOctave,
                             this._tuning.deepCopy(),
                             this.name);
        };


        // CLASS METHODS
        Scale.choose = function(size, pitchesPerOctave) {
            if (typeof size !== "number") {
                size = 7;
            }
            if (typeof pitchesPerOctave !== "number") {
                pitchesPerOctave = 12;
            }
            return ScaleInfo.choose(function(x) {
                return x._degrees.length === size &&
                    x._pitchesPerOctave === pitchesPerOctave;
            });
        };
        Scale.guessPPO = function(degrees) {
            if (!Array.isArray(degrees)) {
                var i, max = degrees[0] || 0;
                for (i = degrees.length; i--; ) {
                    if (degrees[i] > max) {
                        max = degrees[i];
                    }
                }
                var etTypes = [53,24,19,12];
                for (i = etTypes.length; i--; ) {
                    if (max < etTypes[i]) {
                        return etTypes[i];
                    }
                }
            }
            return 128;
        };
        
        
        // ScaleInfo
        var ScaleInfo = (function() {
            var ScaleInfo = {};
            var scales = {};
            
            ScaleInfo.choose = function(selectFunc) {
                var candidates = [];
                var keys = Object.keys(scales);
                var s;
                for (var i = keys.length; i--; ) {
                    s = scales[keys[i]];
                    if (typeof selectFunc !== "function" || selectFunc(s)) {
                        candidates.push(s);
                    }
                }
                s = candidates[(Math.random() * candidates.length)|0];
                if (s) {
                    return s.deepCopy();
                }
            };
            ScaleInfo.at = function(key) {
                var s = scales[key];
                if (s) {
                    return s.deepCopy();
                }
            };
            ScaleInfo.names = function() {
                var keys = Object.keys(scales);
                keys.sort();
                return keys;
            };
            ScaleInfo.register = function(key, scale) {
                if (typeof key === "string" && scale instanceof Scale) {
                    scales[key] = scale;
                    
                    Scale[key] = (function(key) {
                        return function(tuning) {
                            var scale = scales[key].deepCopy();
                            if (typeof tuning === "string") {
                                tuning = timbre.modules.TuningInfo.at(tuning);
                            }
                            if (tuning instanceof timbre.modules.Tuning) {
                                scale.tuning(tuning);
                            }
                            return scale;
                        };
                    }(key));
                }
            };
            
            return ScaleInfo;
        })();
        
        
        ScaleInfo.register(
            "major", new Scale([0,2,4,5,7,9,11], 12, null, "Major")
        );
        ScaleInfo.register(
            "minor", new Scale([0,2,3,5,7,8,10], 12, null, "Natural Minor")
        );
        
        timbre.modules.Scale = Scale;
        timbre.modules.ScaleInfo = ScaleInfo;
    })();
    
})();
