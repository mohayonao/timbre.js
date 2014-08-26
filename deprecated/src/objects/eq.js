(function(T) {
    "use strict";

    var fn = T.fn;
    var FFT = T.modules.FFT;
    var Biquad = T.modules.Biquad;
    var PLOT_LOW_FREQ = 20;
    var PARAM_NAMES = {
        hpf:0, lf:1, lmf:2, mf:3, hmf:4, hf:5, lpf:6
    };

    function EQNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.biquads = new Array(7);

        _.plotBefore = plotBefore;
        _.plotRange  = [-18, 18];
        _.plotFlush  = true;
    }
    fn.extend(EQNode);

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

    var $ = EQNode.prototype;

    Object.defineProperties($, {
        params: {
            set: function(value) {
                if (typeof value === "object") {
                    var keys = Object.keys(value);
                    for (var i = 0, imax = keys.length; i < imax; ++i) {
                        var items = value[keys[i]];
                        if (Array.isArray(items)) {
                            this.setParams(keys[i], items[0], items[1], items[2]);
                        } else {
                            this.setParams(keys[i]);
                        }
                    }
                }
            }
        }
    });

    $.setParams = function(index, freq, Q, gain) {
        var _ = this._;
        if (typeof index === "string") {
            index = PARAM_NAMES[index];
        }
        if (0 <= index && index < _.biquads.length) {
            index |= 0;
            if (typeof freq === "number" && typeof Q === "number") {
                if (typeof gain !== "number") {
                    gain = 0;
                }
                var biquad = _.biquads[index];
                if (!biquad) {
                    biquad = _.biquads[index] = new Biquad(_.samplerate);
                    switch (index) {
                    case 0:
                        biquad.setType("highpass");
                        break;
                    case _.biquads.length - 1:
                        biquad.setType("lowpass");
                        break;
                    default:
                        biquad.setType("peaking");
                        break;
                    }
                }
                biquad.setParams(freq, Q, gain);
            } else {
                _.biquads[index] = undefined;
            }
            _.plotFlush = true;
        }
        return this;
    };

    $.getParams = function(index) {
        var _ = this._;
        var biquad = _.biquads[index|0];
        if (biquad) {
            return {freq:biquad.frequency, Q:biquad.Q, gain:biquad.gain};
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var biquads = _.biquads;
                for (var i = 0, imax = biquads.length; i < imax; ++i) {
                    if (biquads[i]) {
                        biquads[i].process(cellL, cellR);
                    }
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var fft = new FFT(2048);
    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            var _ = this._;
            var impluse = new Float32Array(fft.length);
            impluse[0] = 1;
            for (var i = 0, imax = _.biquads.length; i < imax; ++i) {
                var params = this.getParams(i);
                if (params) {
                    var biquad = new Biquad(_.samplerate);
                    if (i === 0) {
                        biquad.setType("highpass");
                    } else if (i === imax - 1) {
                        biquad.setType("lowpass");
                    } else {
                        biquad.setType("peaking");
                    }
                    biquad.setParams(params.freq, params.Q, params.gain);
                    biquad.process(impluse, impluse);
                }
            }

            fft.forward(impluse);

            var size = 512;
            var data = new Float32Array(size);
            var nyquist  = _.samplerate * 0.5;
            var spectrum = new Float32Array(size);
            var j, f, index, delta, x0, x1, xx;

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

    fn.register("eq", EQNode);

})(timbre);
