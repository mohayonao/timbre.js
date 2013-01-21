(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    var Biquad = timbre.modules.Biquad;
    
    function BiquadNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.biquad = new Biquad(timbre.samplerate);
        _.freq = timbre(340);
        _.band = timbre(1);
        _.gain = timbre(0);
        
        _.plotRange = [-18, 18];
        _.plotFlush = true;
        _.plotBefore = function(context, x, y, width, height) {
            context.lineWidth = 1;
            context.strokeStyle = "rgb(232, 232, 232)";
            var w = width / 4;
            for (var i = 1; i < 4; i++) {
                context.beginPath();
                var _x = ((x + (i * w))|0) + 0.5;
                context.moveTo(_x, y);
                context.lineTo(_x, y + height);
                context.stroke();
            }
            context.strokeStyle = "rgb(192, 192, 192)";
            var h = height / 6;
            for (var i = 1; i < 6; i++) {
                context.beginPath();
                var _y = ((y + (i * h))|0) + 0.5;
                context.moveTo(x, _y);
                context.lineTo(x + width, _y);
                context.stroke();
            }
        };
        
    }
    fn.extend(BiquadNode);
    
    var $ = BiquadNode.prototype;
    
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
        },
        freq: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        cutoff: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        res: {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() {
                return this._.band;
            }
        },
        Q: {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() {
                return this._.band;
            }
        },
        band: {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() {
                return this._.band;
            }
        },
        gain: {
            set: function(value) {
                this._.gain = timbre(value);
            },
            get: function() {
                return this._.gain;
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
            
            var freq = _.freq.process(tickID)[0];
            if (_.prevFreq !== freq) {
                _.prevFreq = freq;
                changed = true;
            }
            var band = _.band.process(tickID)[0];
            if (_.prevband !== band) {
                _.prevband = band;
                changed = true;
            }
            var gain = _.gain.process(tickID)[0];
            if (_.prevGain !== gain) {
                _.prevGain = gain;
                changed = true;
            }
            if (changed) {
                _.biquad.setParams(freq, band, gain);
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
            var biquad = new Biquad(timbre.samplerate);
            biquad.setType(this.type);
            biquad.setParams(this.freq.valueOf(), this.band.valueOf(), this.gain.valueOf());
            
            var impluse = new Float32Array(256);
            impluse[0] = 1;
            
            biquad.process(impluse);
            fft.forward(impluse);

            var size = 512;
            var data = new Float32Array(size);
            var nyquist  = timbre.samplerate * 0.5;
            var spectrum = fft.spectrum;
            var i, j, f, index, delta, x0, x1, xx;
            for (i = 0; i < size; ++i) {
                f = nyquist * Math.pow(size, (i - size) / size);
                j = f / (nyquist / spectrum.length);
                index = j|0;
                delta = j - index;
                if (index === 0) {
                    x1 = x0 = xx = spectrum[index];
                } else {
                    x0 = spectrum[index - 1];
                    x1 = spectrum[index];
                    xx = ((1.0 - delta) * x0 + delta * x1);
                }
                data[i] = Math.log(xx) * Math.LOG10E * 20;
            }
            
            this._.plotData  = data;
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
    
    fn.alias("lpf", "lowpass");
    fn.alias("hpf", "highpass");
    fn.alias("bpf", "bandpass");
    fn.alias("bef", "notch");
    fn.alias("brf", "notch");
    fn.alias("apf", "allpass");

})();
