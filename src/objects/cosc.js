(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue  = timbre.timevalue;
    var Oscillator = timbre.modules.Oscillator;
    
    function COscNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.osc1 = new Oscillator(timbre.samplerate);
        _.osc2 = new Oscillator(timbre.samplerate);
        _.osc1.step = this.cell.length;
        _.osc2.step = this.cell.length;
        _.tmp = new Float32Array(this.cell.length);
        _.beats = 0.5;
        
        this.once("init", oninit);
    }
    fn.extend(COscNode);
    
    var oninit = function() {
        var _ = this._;
        if (!this.wave) {
            this.wave = "sin";
        }
        if (!_.freq) {
            this.freq = 440;
        }
    };
    
    var $ = COscNode.prototype;
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc1.setWave(value);
                this._.osc2.setWave(value);
            },
            get: function() {
                return this._.osc1.wave;
            }
        },
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        return;
                    }
                    value = 1000 / value;
                }
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        beats: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.beats = value;
                }
            },
            get: function() {
                return this._.beats;
            }
        }
    });
    
    $.bang = function() {
        this._.osc1.reset();
        this._.osc2.reset();
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var i, imax = cell.length;
            var freq = _.freq.process(tickID)[0];
            var osc1 = _.osc1, osc2 = _.osc2, tmp = _.tmp;
            
            osc1.frequency = freq - (_.beats * 0.5);
            osc1.process(tmp);
            for (i = imax; i--; ) {
                cell[i] = tmp[i] * 0.5;
            }
            
            osc2.frequency = freq + (_.beats * 0.5);
            osc2.process(tmp);
            for (i = imax; i--; ) {
                cell[i] += tmp[i] * 0.5;
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("cosc", COscNode);
    
})();
