(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue  = T.timevalue;
    var Oscillator = T.modules.Oscillator;

    function OscNode(_args) {
        T.Object.call(this, 2, _args);

        var _ = this._;
        _.freq  = T(440);
        _.phase = T(0);
        _.osc = new Oscillator(_.samplerate);
        _.tmp = new fn.SignalArray(_.cellsize);
        _.osc.step = _.cellsize;

        this.once("init", oninit);
    }
    fn.extend(OscNode);

    var oninit = function() {
        var _ = this._;
        if (!this.wave) {
            this.wave = "sin";
        }
        _.plotData = _.osc.wave;
        _.plotLineWidth = 2;
        _.plotCyclic = true;
        _.plotBefore = plotBefore;
    };

    var $ = OscNode.prototype;

    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc.setWave(value);
            },
            get: function() {
                return this._.osc.wave;
            }
        },
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    } else {
                        value = 1000 / value;
                    }
                }
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        phase: {
            set: function(value) {
                this._.phase = T(value);
                this._.osc.feedback = false;
            },
            get: function() {
                return this._.phase;
            }
        },
        fb: {
            set: function(value) {
                this._.phase = T(value);
                this._.osc.feedback = true;
            },
            get: function() {
                return this._.phase;
            }
        }
    });

    $.clone = function() {
        var instance = fn.clone(this);
        instance._.osc = this._.osc.clone();
        instance._.freq  = this._.freq;
        instance._.phase = this._.phase;
        return instance;
    };

    $.bang = function() {
        this._.osc.reset();
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = _.cellsize;

            if (this.nodes.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = 0; i < imax; ++i) {
                    cellL[i] = cellR[i] = 1;
                }
            }

            var osc = _.osc;
            var freq  = _.freq.process(tickID).cells[0];
            var phase = _.phase.process(tickID).cells[0];

            osc.frequency = freq[0];
            osc.phase     = phase[0];

            if (_.ar) {
                var tmp  = _.tmp;
                if (_.freq.isAr) {
                    if (_.phase.isAr) {
                        osc.processWithFreqAndPhaseArray(tmp, freq, phase);
                    } else {
                        osc.processWithFreqArray(tmp, freq);
                    }
                } else {
                    if (_.phase.isAr) {
                        osc.processWithPhaseArray(tmp, phase);
                    } else {
                        osc.process(tmp);
                    }
                }
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= tmp[i];
                    cellR[i] *= tmp[i];
                }
            } else {
                var value = osc.next();
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= value;
                    cellR[i] *= value;
                }
            }
            fn.outputSignalAR(this);
        }

        return this;
    };

    var plotBefore;
    if (T.envtype === "browser") {
        plotBefore = function(context, offset_x, offset_y, width, height) {
            var y = (height >> 1) + 0.5;
            context.strokeStyle = "#ccc";
            context.lineWidth   = 1;
            context.beginPath();
            context.moveTo(offset_x, y + offset_y);
            context.lineTo(offset_x + width, y + offset_y);
            context.stroke();
        };
    }

    fn.register("osc", OscNode);

    fn.register("sin", function(_args) {
        return new OscNode(_args).set("wave", "sin");
    });
    fn.register("cos", function(_args) {
        return new OscNode(_args).set("wave", "cos");
    });
    fn.register("pulse", function(_args) {
        return new OscNode(_args).set("wave", "pulse");
    });
    fn.register("tri", function(_args) {
        return new OscNode(_args).set("wave", "tri");
    });
    fn.register("saw", function(_args) {
        return new OscNode(_args).set("wave", "saw");
    });
    fn.register("fami", function(_args) {
        return new OscNode(_args).set("wave", "fami");
    });
    fn.register("konami", function(_args) {
        return new OscNode(_args).set("wave", "konami");
    });
    fn.register("+sin", function(_args) {
        return new OscNode(_args).set("wave", "+sin").kr();
    });
    fn.register("+pulse", function(_args) {
        return new OscNode(_args).set("wave", "+pulse").kr();
    });
    fn.register("+tri", function(_args) {
        return new OscNode(_args).set("wave", "+tri").kr();
    });
    fn.register("+saw", function(_args) {
        return new OscNode(_args).set("wave", "+saw").kr();
    });

    fn.alias("square", "pulse");

})(timbre);
