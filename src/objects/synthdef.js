(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function SynthDefNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;

        _.poly     = 4;        
        _.genList  = [];
        _.genDict  = {};
        _.synthdef = null;
        _.isEnded  = true;
        
        _.remGen = remGen.bind(this);
    }
    fn.extend(SynthDefNode);
    
    var $ = SynthDefNode.prototype;
    
    Object.defineProperties($, {
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
        def: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.synthdef = value;
                }
            },
            get: function() {
                return this._.synthdef;
            }
        }
    });
    
    var noteOn = function(freq, noteNum, velocity) {
        velocity |= 0;
        if (velocity <= 0) {
            this.noteOff(this, noteNum);
        } else if (velocity > 127) {
            velocity = 127;
        }
        var _ = this._;
        var list = _.genList, dict = _.genDict;
        var gen = dict[noteNum];
        if (gen) {
            _.remGen(gen);
        }
        
        gen = this._.synthdef.call(this, {freq:freq, noteNum:noteNum, velocity:velocity});
        
        if (gen instanceof timbre.Object) {
            gen.noteNum = noteNum;
            list.push(gen);
            dict[noteNum] = gen;
            
            _.isEnded = false;
            
            if (list.length >= _.poly) {
                _.remGen(list[0]);
            }
        }
    };
    
    var remGen = function(gen) {
        var _ = this._;
        var i = _.genList.indexOf(gen);
        if (i !== -1) {
            _.genList.splice(i, 1);
        }
        _.genDict[gen.noteNum] = null;
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
    
    $.allNoteOff = function() {
        var _ = this._;
        var list = _.genList;
        var dict = _.genDict;
        var gen;
        while (list.length) {
            gen = list.shift();
            gen.release();
            delete dict[gen.noteNum];
        }
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
                    fn.nextTick(__onended.bind(this));
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("SynthDef", SynthDefNode);
    
    fn.register("OscGen", function(_args) {
        var instance = new SynthDefNode(_args);
        
        instance._.wave = "sin";
        
        Object.defineProperties(instance, {
            wave: {
                set: function(value) {
                    if (typeof value === "string") {
                        this._.wave = value;
                    }
                },
                get: function() {
                    return this._.wave;
                }
            }
        });
        
        var synthdef = function(opts) {
            var _ = this._, synth;
            
            synth = timbre("osc", {wave:_.wave, freq:opts.freq, mul:opts.velocity/128});
            synth = timbre(_.env.type, _.env, synth);
            synth.on("ended", function() {
                _.remGen(this);
            }).bang();
            
            return synth;
        };
        
        instance.def = synthdef;
        
        return instance;
    });

    fn.register("PluckGen", function(_args) {
        var instance = new SynthDefNode(_args);
        
        var synthdef = function(opts) {
            var _ = this._, synth;
            
            synth = timbre("pluck", {freq:opts.freq, mul:opts.velocity/128}).bang();
            synth = timbre(_.env.type, _.env, synth);
            synth.on("ended", function() {
                _.remGen(this);
            }).bang();
            
            return synth;
        };
        
        instance.def = synthdef;
        
        return instance;
    });
    
})(timbre);
