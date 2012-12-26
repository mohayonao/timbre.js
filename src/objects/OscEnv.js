(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function OscEnv(_args) {
        timbre.Object.call(this, _args);
        
        var _ = this._;
        _.genList = [];
        _.genDict = {};
        _.poly = 4;
        _.wave = "sin";
        _.env = { type:"perc" };
        _.isEnded = true;
    }
    fn.extend(OscEnv);
    
    var $ = OscEnv.prototype;

    Object.defineProperties($, {
        wave: {
            set: function(value) {
                if (typeof value === "string") {
                    this._.wave = value;
                }
            },
            get: function() {
                return this._.wave;
            }
        },
        env: {
            set: function(value) {
                if (typeof value === "object" && value.constructor === Object) {
                    if (typeof value.type === "string") {
                        this._.env = value;
                    }
                }
            },
            get: function() {
                return this._.env;
            }
        },
        poly: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 < value && value <= 64) {
                        this._.poly = value;
                    }
                }
            },
            get: function() {
                return this._.poly;
            }
        }
    });


    
    var remGen = function(gen) {
        var _ = this._;
        var i = _.genList.indexOf(gen);
        if (i !== -1) {
            _.genList.splice(i, 1);
        }
        _.genDict[gen.noteNum] = null;
    };
    
    var noteOn = function(freq, noteNum, velocity) {
        velocity /= 128;
        if (velocity <= 0) {
            this.noteOff(this, noteNum);
        } else if (velocity > 1) {
            velocity = 1;
        }
        var self = this, _ = this._;
        var list = _.genList, dict = _.genDict;
        var gen = dict[noteNum];
        if (gen) {
            remGen.call(this, gen);
        }
        
        var wave = _.wave;
        var osc  = timbre("osc", {wave:wave, freq:freq, mul:velocity});
        var envType = _.env.type;
        
        gen = timbre(envType, _.env, osc).on("ended", function() {
            remGen.call(self, this);
        }).bang();
        gen.noteNum = noteNum;
        list.push(gen);
        
        _.isEnded = false;
        
        if (list.length >= _.poly) {
            remGen.call(this, list[0]);
        }
    };
    
    $.noteOn = function(noteNum, velocity) {
        var freq = midicps[noteNum|0] || 0;
        noteOn.call(this, freq, noteNum, velocity);
        return this;
    };
    
    var midicps = (function() {
        var table = new Float32Array(128);
        for (var i = 0; i < 128; ++i) {
            table[i] = 440 * Math.pow(2, (i - 69) * 1 / 12);
        }
        return table;
    })();
    
    var cpsmidi = function(cps) {
        if (cps > 0) {
            return ((Math.log(cps * 1 / 440) * Math.LOG2E * 12 + 69) + 0.5)|0;
        } else {
            return 0;
        }
    };
    
    $.noteOnWithFreq = function(freq, velocity) {
        noteOn.call(this, freq, cpsmidi(freq), velocity);
        return this;
    };
    
    $.noteOff = function(noteNum /* , velocity */) {
        var gen = this._.genDict[noteNum];
        if (gen) {
            gen.release();
        }
        return this;
    };
    
    $.noteOffWithFreq = function(freq /* , velocity */) {
        return this.noteOff(cpsmidi(freq));
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            // process
            if (!_.isEnded) {
                var list;
                var i, imax;
                var j, jmax = cell.length;
                var tmp;
                
                list = _.genList;
                for (i = 0, imax = list.length; i < imax; ++i) {
                    tmp = list[i].process(tickID);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                if (imax === 0) {
                    fn.nextTick(onended.bind(this));
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this);
    };
    
    fn.register("OscEnv", OscEnv);
    
})(timbre);
