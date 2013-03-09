(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var FFT = T.modules.FFT;

    var WAIT_STATE = 0;
    var EXEC_STATE = 1;

    function SpectrumNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.status  = WAIT_STATE;
        _.samples = 0;
        _.samplesIncr = 0;
        _.writeIndex  = 0;

        _.plotFlush = true;
        _.plotRange = [0, 32];
        _.plotBarStyle = true;

        this.once("init", oninit);
    }
    fn.extend(SpectrumNode);

    var oninit = function() {
        var _ = this._;
        if (!_.fft) {
            this.size = 512;
        }
        if (!_.interval) {
            this.interval = 500;
        }
    };

    var $ = SpectrumNode.prototype;

    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.fft) {
                    if (typeof value === "number") {
                        var n = (value < 256) ? 256 : (value > 2048) ? 2048 : value;
                        _.fft    = new FFT(n);
                        _.buffer = new fn.SignalArray(_.fft.length);
                        _.freqs  = new fn.SignalArray(_.fft.length>>1);
                        if (_.reservedwindow) {
                            _.fft.setWindow(_.reservedwindow);
                            _.reservedwindow = null;
                        }
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        window: {
            set: function(value) {
                this._.fft.setWindow(value);
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval = value;
                        _.samplesIncr = (value * 0.001 * _.samplerate);
                        if (_.samplesIncr < _.buffer.length) {
                            _.samplesIncr = _.buffer.length;
                            _.interval = _.samplesIncr * 1000 / _.samplerate;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        },
        spectrum: {
            get: function() {
                return this._.fft.getFrequencyData(this._.freqs);
            }
        },
        real: {
            get: function() {
                return this._.fft.real;
            }
        },
        imag: {
            get: function() {
                return this._.fft.imag;
            }
        }
    });

    $.bang = function() {
        this._.samples    = 0;
        this._.writeIndex = 0;
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var i, imax = cell.length;
            var status  = _.status;
            var samples = _.samples;
            var samplesIncr = _.samplesIncr;
            var writeIndex  = _.writeIndex;
            var buffer = _.buffer;
            var bufferLength = buffer.length;
            var emit;

            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    if (status === WAIT_STATE) {
                        status = EXEC_STATE;
                        writeIndex = 0;
                        samples += samplesIncr;
                    }
                }
                if (status === EXEC_STATE) {
                    buffer[writeIndex++] = cell[i];
                    if (bufferLength <= writeIndex) {
                        _.fft.forward(buffer);
                        emit = _.plotFlush = true;
                        status = WAIT_STATE;
                    }
                }
                --samples;
            }

            _.samples = samples;
            _.status  = status;
            _.writeIndex = writeIndex;

            if (emit) {
                this._.emit("data");
            }
        }
        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            this._.plotData  = this.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("spectrum", SpectrumNode);

})(timbre);
