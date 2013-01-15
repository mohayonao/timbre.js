(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    var Biquad = timbre.modules.Biquad;
    
    function BiquadNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this.attrs[ATTRS_FREQ] = timbre(340);
        this.attrs[ATTRS_Q]    = timbre(1);
        this.attrs[ATTRS_GAIN] = timbre(0);
        
        var _ = this._;
        _.biquad = new Biquad({samplerate:timbre.samplerate});
        
        _.plotRange = [0, 1.2];
        _.plotFlush = true;
    }
    fn.extend(BiquadNode);
    
    var $ = BiquadNode.prototype;
    
    var ATTRS_FREQ = fn.setAttrs($, ["freq", "frequency", "cutoff"], {
        conv: function(value) {
            if (typeof value === "string") {
                value = timevalue(value);
                if (value <= 0) {
                    return 0;
                }
                return 1000 / value;
            }
            return value;
        }
    });
    var ATTRS_Q    = fn.setAttrs($, "Q");
    var ATTRS_GAIN = fn.setAttrs($, "gain");
    
    Object.defineProperties($, {
        type: {
            set: function(value) {
                var _ = this._;
                if (value !== _.biquad.type) {
                    _.biquad.setType(value);
                    _.plotFlush = true;
                }
            },
            get: function() {
                return this._.biquad.type;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;
            
            var freq = this.attrs[ATTRS_FREQ].process(tickID)[0];
            if (_.prevFreq !== freq) {
                _.prevFreq = freq;
                changed = true;
            }
            var Q = this.attrs[ATTRS_Q].process(tickID)[0];
            if (_.prevQ !== Q) {
                _.prevQ = Q;
                changed = true;
            }
            var gain = this.attrs[ATTRS_GAIN].process(tickID)[0];
            if (_.prevGain !== gain) {
                _.prevGain = gain;
                changed = true;
            }
            if (changed) {
                _.biquad.setParams(freq, Q, gain);
                _.plotFlush = true;
            }
            
            _.biquad.process(cell);
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    var fft = new FFT(256);
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new Biquad({type:this.type,samplerate:timbre.samplerate});
            biquad.setParams(this.freq.valueOf(), this.Q.valueOf(), this.gain.valueOf());
            
            var impluse = new Float32Array(256);
            impluse[0] = 1;
            
            biquad.process(impluse);
            fft.forward(impluse);
            
            this._.plotData  = fft.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    
    
    fn.register("biquad", BiquadNode);
    
    fn.register("lowpass", function(_args) {
        return new BiquadNode(_args).set("type", "lowpass");
    });
    fn.register("highpass", function(_args) {
        return new BiquadNode(_args).set("type", "highpass");
    });
    fn.register("bandpass", function(_args) {
        return new BiquadNode(_args).set("type", "bandpass");
    });
    fn.register("lowshelf", function(_args) {
        return new BiquadNode(_args).set("type", "lowshelf");
    });
    fn.register("highshelf", function(_args) {
        return new BiquadNode(_args).set("type", "highshelf");
    });
    fn.register("peaking", function(_args) {
        return new BiquadNode(_args).set("type", "peaking");
    });
    fn.register("notch", function(_args) {
        return new BiquadNode(_args).set("type", "notch");
    });
    fn.register("allpass", function(_args) {
        return new BiquadNode(_args).set("type", "allpass");
    });
    
    fn.alias("LPF", "lowpass");
    fn.alias("HPF", "highpass");
    fn.alias("BPF", "bandpass");
    fn.alias("BEF", "notch");
    fn.alias("BRF", "notch");
    fn.alias("APF", "allpass");

})();
