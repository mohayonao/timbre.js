(function() {
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
        def: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.synthdef = value;
                }
            },
            get: function() {
                return this._.synthdef;
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
    
    var doneAction = function(opts) {
        remGen.call(this, opts.gen);
    };
    
    var remGen = function(gen) {
        var _ = this._;
        var i = _.genList.indexOf(gen);
        if (i !== -1) {
            _.genList.splice(i, 1);
        }
        _.genDict[gen.noteNum] = null;
    };
    
    var noteOn = function(noteNum, freq, velocity, _opts) {
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
        
        var opts = {
            freq    : freq,
            noteNum : noteNum,
            velocity: velocity
        };
        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = doneAction.bind(this, opts);
        
        gen = this._.synthdef.call(this, opts);
        
        if (gen instanceof timbre.Object) {
            gen.noteNum = noteNum;
            list.push(gen);
            dict[noteNum] = opts.gen = gen;
            
            _.isEnded = false;
            
            if (list.length >= _.poly) {
                _.remGen(list[0]);
            }
        }
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
            return Math.log(cps * 1 / 440) * Math.LOG2E * 12 + 69;
        } else {
            return 0;
        }
    };
    
    $.noteOn = function(noteNum, velocity, _opts) {
        var freq = midicps[noteNum] || (440 * Math.pow(2, (noteNum - 69) / 12));
        noteOn.call(this, (noteNum + 0.5)|0, freq, velocity, _opts);
        return this;
    };
    
    $.noteOff = function(noteNum) {
        var gen = this._.genDict[noteNum];
        if (gen && gen.release) {
            gen.release();
        }
        return this;
    };
    
    $.noteOnWithFreq = function(freq, velocity, _opts) {
        var noteNum = cpsmidi(freq);
        noteOn.call(this, (noteNum + 0.5)|0, freq, velocity, _opts);
        return this;
    };
    
    $.noteOffWithFreq = function(freq) {
        var noteNum = cpsmidi(freq);
        return this.noteOff((noteNum + 0.5)|0);
    };
    
    $.allNoteOff = function() {
        var list = this._.genList;
        for (var i = 0, imax = list.length; i < imax; ++i) {
            if (list[i].release) {
                list[i].release();
            }
        }
    };
    
    $.allSoundOff = function() {
        var _ = this._;
        var list = _.genList;
        var dict = _.genDict;
        while (list.length) {
            delete dict[list.shift().noteNum];
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
                    fn.nextTick(fn.onended.bind(null, this));
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("SynthDef", SynthDefNode);
    
    
    var env_desc = {
        set: function(value) {
            if (typeof value === "object" && value.constructor === Object) {
                if (typeof value.type === "string") {
                    this._.env = value;
                }
            } else if (value instanceof timbre.Object) {
                this._.env = value;
            }
        },
        get: function() {
            return this._.env;
        }
    };
    
    fn.register("OscGen", (function() {

        var wave_desc = {
            set: function(value) {
                if (typeof value === "string") {
                    this._.wave = value;
                }
            },
            get: function() {
                return this._.wave;
            }
        };
        
        var synthdef = function(opts) {
            var _ = this._;
            var synth, env, envtype;
            
            env = _.env || {};
            envtype = env.type || "perc";
            
            synth = timbre("osc", {wave:_.wave, freq:opts.freq, mul:opts.velocity/128});
            if (env instanceof timbre.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = timbre(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();
            
            return synth;
        };
        
        return function(_args) {
            var instance = new SynthDefNode(_args);
            
            instance._.wave = "sin";
            
            Object.defineProperties(instance, {
                env: env_desc, wave: wave_desc
            });
            
            instance.def = synthdef;
            
            return instance;
        };
    })());
    
    fn.register("PluckGen", (function() {
        
        var synthdef = function(opts) {
            var _ = this._;
            var synth, env, envtype;
            
            env = _.env || {};
            envtype = env.type || "perc";
            
            synth = timbre("pluck", {freq:opts.freq, mul:opts.velocity/128}).bang();
            if (env instanceof timbre.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = timbre(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();
            
            return synth;
        };
        
        return function(_args) {
            var instance = new SynthDefNode(_args);
            
            Object.defineProperties(instance, {
                env: env_desc
            });
            
            instance.def = synthdef;
            
            return instance;
        };
    })());
    
})();
