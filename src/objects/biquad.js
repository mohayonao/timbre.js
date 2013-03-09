(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;
    var Biquad = T.modules.Biquad;
    var PLOT_LOW_FREQ = 20;

    function BiquadNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.biquad = new Biquad(_.samplerate);
        _.freq = T(340);
        _.band = T(1);
        _.gain = T(0);

        _.plotBefore = plotBefore;
        _.plotRange  = [-18, 18];
        _.plotFlush  = true;
    }
    fn.extend(BiquadNode);

    var plotBefore = function(context, x, y, width, height) {
        context.lineWidth = 1;
        context.strokeStyle = "rgb(192, 192, 192)";
        var nyquist = this._.samplerate * 0.5;
        for (var i = 1; i <= 10; ++i) {
            for (var j = 1; j <= 4; j++) {
                var f = i * Math.pow(10, j);
                if (f <= PLOT_LOW_FREQ || nyquist <= f) {
                    continue;
                }
                context.beginPath();
                var _x = (Math.log(f/PLOT_LOW_FREQ)) / (Math.log(nyquist/PLOT_LOW_FREQ));
                _x = ((_x * width + x)|0) + 0.5;
                context.moveTo(_x, y);
                context.lineTo(_x, y + height);
                context.stroke();
            }
        }

        var h = height / 6;
        for (i = 1; i < 6; i++) {
            context.beginPath();
            var _y = ((y + (i * h))|0) + 0.5;
            context.moveTo(x, _y);
            context.lineTo(x + width, _y);
            context.stroke();
        }
    };

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
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        cutoff: {
            set: function(value) {
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        res: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        Q: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        band: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        gain: {
            set: function(value) {
                this._.gain = T(value);
            },
            get: function() {
                return this._.gain;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var freq = _.freq.process(tickID).cells[0][0];
            var band = _.band.process(tickID).cells[0][0];
            var gain = _.gain.process(tickID).cells[0][0];
            if (_.prevFreq !== freq || _.prevband !== band || _.prevGain !== gain) {
                _.prevFreq = freq;
                _.prevband = band;
                _.prevGain = gain;
                _.biquad.setParams(freq, band, gain);
                _.plotFlush = true;
            }

            if (!_.bypassed) {
                _.biquad.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var fft = new FFT(2048);
    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new Biquad(this._.samplerate);
            biquad.setType(this.type);
            biquad.setParams(this.freq.valueOf(), this.band.valueOf(), this.gain.valueOf());

            var impluse = new Float32Array(fft.length);
            impluse[0] = 1;

            biquad.process(impluse, impluse);
            fft.forward(impluse);

            var size = 512;
            var data = new Float32Array(size);
            var nyquist  = this._.samplerate * 0.5;
            var spectrum = new Float32Array(size);
            var i, j, f, index, delta, x0, x1, xx;

            fft.getFrequencyData(spectrum);
            for (i = 0; i < size; ++i) {
                f = Math.pow(nyquist / PLOT_LOW_FREQ, i / size) * PLOT_LOW_FREQ;
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
                data[i] = xx;
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

})(timbre);
