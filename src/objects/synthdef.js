(function(T) {
    "use strict";

    var fn = T.fn;

    function SynthDefNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.poly     = 4;
        _.genList  = [];
        _.genDict  = {};
        _.synthdef = null;
        _.remGen = make_remGen(this);
        _.onended = fn.make_onended(this);
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

    var make_doneAction = function(self, opts) {
        return function() {
            self._.remGen(opts.gen);
        };
    };

    var make_remGen = function(self) {
        return function(gen) {
            var _ = self._;
            var i = _.genList.indexOf(gen);
            if (i !== -1) {
                _.genList.splice(i, 1);
            }
            if (typeof gen.noteNum !== "undefined") {
                _.genDict[gen.noteNum] = null;
            }
        };
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
            velocity: velocity,
            mul     : velocity * 0.0078125
        };
        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = make_doneAction(this, opts);

        gen = _.synthdef.call(this, opts);

        if (gen instanceof T.Object) {
            gen.noteNum = noteNum;
            list.push(gen);
            dict[noteNum] = opts.gen = gen;

            this.playbackState = fn.PLAYING_STATE;

            if (list.length > _.poly) {
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

    $.synth = function(_opts) {
        var _ = this._;
        var list = _.genList;
        var gen, opts = {};

        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = make_doneAction(this, opts);

        gen = _.synthdef.call(this, opts);

        if (gen instanceof T.Object) {
            list.push(gen);
            opts.gen = gen;
            this.playbackState = fn.PLAYING_STATE;

            if (list.length > _.poly) {
                _.remGen(list[0]);
            }
        }

        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (this.playbackState === fn.PLAYING_STATE) {
                var list = _.genList;
                var gen;
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var i, imax;
                var j, jmax = cell.length;
                var tmpL, tmpR;

                if (list.length) {
                    gen = list[0];
                    gen.process(tickID);
                    cellL.set(gen.cells[1]);
                    cellR.set(gen.cells[2]);
                    for (i = 1, imax = list.length; i < imax; ++i) {
                        gen = list[i];
                        gen.process(tickID);
                        tmpL = gen.cells[1];
                        tmpR = gen.cells[2];
                        for (j = 0; j < jmax; ++j) {
                            cellL[j] += tmpL[j];
                            cellR[j] += tmpR[j];
                        }
                    }
                } else {
                    fn.nextTick(_.onended);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("SynthDef", SynthDefNode);


    var env_desc = {
        set: function(value) {
            if (fn.isDictionary(value)) {
                if (typeof value.type === "string") {
                    this._.env = value;
                }
            } else if (value instanceof T.Object) {
                this._.env = value;
            }
        },
        get: function() {
            return this._.env;
        }
    };

    fn.register("OscGen", (function() {

        var osc_desc = {
            set: function(value) {
                if (value instanceof T.Object) {
                    this._.osc = value;
                }
            },
            get: function() {
                return this._.osc;
            }
        };

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
            var synth, osc, env, envtype;

            osc = _.osc || null;
            env = _.env || {};
            envtype = env.type || "perc";

            if (osc instanceof T.Object) {
                if (typeof osc.clone === "function") {
                    osc = osc.clone();
                }
            }
            if (!osc) {
                osc = T("osc", {wave:_.wave});
            }
            osc.freq = opts.freq;
            osc.mul  = osc.mul * opts.velocity/128;

            synth = osc;
            if (env instanceof T.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = T(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();

            return synth;
        };

        return function(_args) {
            var instance = new SynthDefNode(_args);

            instance._.wave = "sin";

            Object.defineProperties(instance, {
                env: env_desc, osc: osc_desc, wave: wave_desc
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

            synth = T("pluck", {freq:opts.freq, mul:opts.velocity/128}).bang();
            if (env instanceof T.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = T(envtype, env, synth);
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

})(timbre);
