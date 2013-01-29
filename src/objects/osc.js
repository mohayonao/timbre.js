(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue  = timbre.timevalue;
    var Oscillator = timbre.modules.Oscillator;
    
    function OscNode(_args) {
        timbre.Object.call(this, _args);
        
        var _ = this._;
        _.freq  = timbre(440);
        _.phase = timbre(0);
        _.osc = new Oscillator(timbre.samplerate);
        _.tmp = new Float32Array(this.cell.length);
        _.osc.step = this.cell.length;
        
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
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        phase: {
            set: function(value) {
                this._.phase = timbre(value);
            },
            get: function() {
                return this._.phase;
            }
        }
    });
    
    $.bang = function() {
        this._.osc.reset();
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = cell.length;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            var osc   = _.osc;
            var  freq  = _.freq;
            var _freq  = _.freq.process(tickID);
            var phase  = _.phase;
            var _phase = _.phase.process(tickID);
            
            if (_.ar) {
                var tmp  = _.tmp;
                if (freq.isAr) {
                    if (phase.isAr) {
                        osc.processWithFreqAndPhaseArray(tmp, _freq, _phase);
                    } else {
                        osc.phase = _phase[0];
                        osc.processWithFreqArray(tmp, _freq);
                    }
                } else {
                    osc.frequency = _freq[0];
                    if (phase.isAr) {
                        osc.processWithPhaseArray(tmp, _phase);
                    } else {
                        osc.phase = _phase[0];
                        osc.process(tmp);
                    }
                }
                for (i = imax; i--; ) {
                    cell[i] *= tmp[i];
                }
            } else {
                osc.frequency = _freq[0];
                osc.phase     = _phase[0];
                var value = osc.next();
                for (i = imax; i--; ) {
                    cell[i] *= value;
                }
            }
            fn.outputSignalAR(this);
        }
        
        return cell;
    };

    var plotBefore;
    if (timbre.envtype === "browser") {
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
    
})();
