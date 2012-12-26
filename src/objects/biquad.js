(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function Biquad(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this._.biquad = new BiquadFilter({samplerate:timbre.samplerate});
        
        this._.plotRange = [0, 1.2];
        this._.plotFlush = true;
        
        this.once("init", oninit);
    }
    fn.extend(Biquad);
    
    var oninit = function() {
        if (!this._.freq) {
            this.freq = 340;
        }
        if (!this._.Q) {
            this.Q = 1;
        }
        if (!this._.gain) {
            this.gain = 0;
        }
    };
    
    var $ = Biquad.prototype;
    
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
        Q: {
            set: function(value) {
                this._.Q = timbre(value);
            },
            get: function() {
                return this._.Q;
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
            var Q = _.Q.process(tickID)[0];
            if (_.prevQ !== Q) {
                _.prevQ = Q;
                changed = true;
            }
            var gain = _.gain.process(tickID)[0];
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
    
    var fft = new timbre.utils.FFT(256);
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new BiquadFilter({type:this.type,samplerate:timbre.samplerate});
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
    
    
    function BiquadFilter(opts) {
        opts = opts || {};
        
        this.samplerate = opts.samplerate || 44100;
        this.frequency = 340;
        this.Q = 1;
        this.gain = 0;
        
        this.x1 = this.x2 = this.y1 = this.y2 = 0;
        this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
        
        this.setType(setParams[opts.type] ? opts.type : "LPF");
    }
    
    BiquadFilter.prototype.process = function(cell) {
        var x0, y0;
        var x1 = this.x1;
        var x2 = this.x2;
        var y1 = this.y1;
        var y2 = this.y2;
        
        var b0 = this.b0;
        var b1 = this.b1;
        var b2 = this.b2;
        var a1 = this.a1;
        var a2 = this.a2;
        
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            x0 = cell[i];
            y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            cell[i] = (y0 < -1) ? -1 : (y0 > 1) ? 1 : y0;
            
            x2 = x1;
            x1 = x0;
            y2 = y1;
            y1 = y0;
        }
        
        // flushDenormalFloatToZero
        if ((x1 > 0 && x1 <  1e-4) || (x1 < 0 && x1 > -1e-4)) {
            x1 = 0;
        }
        if ((y1 > 0 && y1 <  1e-4) || (y1 < 0 && y1 > -1e-4)) {
            y1 = 0;
        }
        
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    };
    
    BiquadFilter.prototype.setType = function(type) {
        var f;
        if ((f = setParams[type])) {
            this.type = type;
            f.call(this, this.frequency, this.Q, this.gain);
        }
    };
    
    BiquadFilter.prototype.setParams = function(frequency, Q, dbGain) {
        this.frequency = frequency;
        this.Q = Q;
        this.gain = dbGain;
        
        var f = setParams[this.type];
        if (f) {
            f.call(this, frequency, Q, dbGain);
        }
        
        return this;
    };
    
    
    var setParams = {
        lowpass: function(cutoff, resonance) {
            cutoff /= (this.samplerate * 0.5);
            
            if (cutoff >= 1) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (cutoff <= 0) {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                resonance = (resonance < 0) ? 0 : resonance;
                var g = Math.pow(10.0, 0.05 * resonance);
                var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) * 0.5);
                
                var theta = Math.PI * cutoff;
                var sn = 0.5 * d * Math.sin(theta);
                var beta = 0.5 * (1 - sn) / (1 + sn);
                var gamma = (0.5 + beta) * Math.cos(theta);
                var alpha = 0.25 * (0.5 + beta - gamma);
                
                this.b0 = 2 * alpha;
                this.b1 = 4 * alpha;
                this.b2 = this.b0; // 2 * alpha;
                this.a1 = 2 * -gamma;
                this.a2 = 2 * beta;
            }
        },
        highpass: function(cutoff, resonance) {
            cutoff /= (this.samplerate * 0.5);
            if (cutoff >= 1) {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (cutoff <= 0) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                resonance = (resonance < 0) ? 0 : resonance;

                var g = Math.pow(10.0, 0.05 * resonance);
                var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) / 2);

                var theta = Math.PI * cutoff;
                var sn = 0.5 * d * Math.sin(theta);
                var beta = 0.5 * (1 - sn) / (1 + sn);
                var gamma = (0.5 + beta) * Math.cos(theta);
                var alpha = 0.25 * (0.5 + beta + gamma);
                
                this.b0 = 2 * alpha;
                this.b1 = -4 * alpha;
                this.b2 = this.b0; // 2 * alpha;
                this.a1 = 2 * -gamma;
                this.a2 = 2 * beta;
            }
        },
        bandpass: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);
            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = alpha * ia0;
                    this.b1 = 0;
                    this.b2 = -alpha * ia0;
                    this.a1 = -2 * k * ia0;
                    this.a2 = (1 - alpha) * ia0;
                } else {
                    this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        lowshelf: function(frequency, _dummy_, dbGain) {
            frequency /= (this.samplerate * 0.5);

            var A = Math.pow(10.0, dbGain / 40);
            
            if (frequency >= 1) {
                this.b0 = A* A;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (frequency <= 0) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                var w0 = Math.PI * frequency;
                var S = 1; // filter slope (1 is max value)
                var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
                var k = Math.cos(w0);
                var k2 = 2 * Math.sqrt(A) * alpha;
                var aPlusOne = A + 1;
                var aMinusOne = A - 1;
                
                var ia0 = 1 / (aPlusOne + aMinusOne * k + k2);
                
                this.b0 = (A * (aPlusOne - aMinusOne * k + k2)) * ia0;
                this.b1 = (2 * A * (aMinusOne - aPlusOne * k)) * ia0;
                this.b2 = (A * (aPlusOne - aMinusOne * k - k2)) * ia0;
                this.a1 = (-2 * (aMinusOne + aPlusOne * k)) * ia0;
                this.a2 = (aPlusOne + aMinusOne * k - k2) * ia0;
            }
        },
        highshelf: function(frequency, _dummy_, dbGain) {
            frequency /= (this.samplerate * 0.5);

            var A = Math.pow(10.0, dbGain / 40);

            if (frequency >= 1) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (frequency <= 0) {
                this.b0 = A * A;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                var w0 = Math.PI * frequency;
                var S = 1; // filter slope (1 is max value)
                var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
                var k = Math.cos(w0);
                var k2 = 2 * Math.sqrt(A) * alpha;
                var aPlusOne = A + 1;
                var aMinusOne = A - 1;
                
                var ia0 = 1 / (aPlusOne - aMinusOne * k + k2);
                
                this.b0 = (A * (aPlusOne + aMinusOne * k + k2)) * ia0;
                this.b1 = (-2 * A * (aMinusOne + aPlusOne * k)) * ia0;
                this.b2 = (A * (aPlusOne + aMinusOne * k - k2)) * ia0;
                this.a1 = (2 * (aMinusOne - aPlusOne * k)) * ia0;
                this.a2 = (aPlusOne - aMinusOne * k - k2) * ia0;
            }
        },
        peaking: function(frequency, Q, dbGain) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                var A = Math.pow(10.0, dbGain / 40);
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha / A);
                    
                    this.b0 = (1 + alpha * A) * ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = (1 - alpha * A) * ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = (1 - alpha / A) * ia0;
                } else {
                    this.b0 = A * A;
                    this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        notch: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = (1 - alpha) * ia0;
                } else {
                    this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        allpass: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = (1 - alpha) * ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = (1 + alpha) * ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = this.b0; // (1 - alpha) * ia0;
                } else {
                    this.b0 = -1;
                    this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        }
    };
    
    setParams.LPF = setParams.lowpass;
    setParams.HPF = setParams.highpass;
    setParams.BPF = setParams.bandpass;
    setParams.BEF = setParams.notch;
    setParams.BRF = setParams.notch;
    setParams.APF = setParams.allpass;
    
    fn.register("biquad", Biquad);
    
    fn.register("lowpass", function(_args) {
        return new Biquad(_args).set("type", "lowpass");
    });
    fn.register("highpass", function(_args) {
        return new Biquad(_args).set("type", "highpass");
    });
    fn.register("bandpass", function(_args) {
        return new Biquad(_args).set("type", "bandpass");
    });
    fn.register("lowshelf", function(_args) {
        return new Biquad(_args).set("type", "lowshelf");
    });
    fn.register("highshelf", function(_args) {
        return new Biquad(_args).set("type", "highshelf");
    });
    fn.register("peaking", function(_args) {
        return new Biquad(_args).set("type", "peaking");
    });
    fn.register("notch", function(_args) {
        return new Biquad(_args).set("type", "notch");
    });
    fn.register("allpass", function(_args) {
        return new Biquad(_args).set("type", "allpass");
    });
    
    fn.alias("LPF", "lowpass");
    fn.alias("HPF", "highpass");
    fn.alias("BPF", "bandpass");
    fn.alias("BEF", "notch");
    fn.alias("BRF", "notch");
    fn.alias("APF", "allpass");
    
    timbre.utils.BiquadFilter = BiquadFilter;
})(timbre);
