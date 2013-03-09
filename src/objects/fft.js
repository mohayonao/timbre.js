(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;

    function FFTNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        this.real = new T.ChannelObject(this);
        this.imag = new T.ChannelObject(this);
        this.cells[3] = this.real.cell;
        this.cells[4] = this.imag.cell;

        var _ = this._;
        _.fft = new FFT(_.cellsize * 2);
        _.fftCell  = new fn.SignalArray(_.fft.length);
        _.prevCell = new fn.SignalArray(_.cellsize);
        _.freqs    = new fn.SignalArray(_.fft.length>>1);

        _.plotFlush = true;
        _.plotRange = [0, 32];
        _.plotBarStyle = true;
    }
    fn.extend(FFTNode);

    var $ = FFTNode.prototype;

    Object.defineProperties($, {
        window: {
            set: function(value) {
                this._.fft.setWindow(value);
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        spectrum: {
            get: function() {
                return this._.fft.getFrequencyData(this._.freqs);
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var cellsize = _.cellsize;

            _.fftCell.set(_.prevCell);
            _.fftCell.set(cell, cellsize);
            _.fft.forward(_.fftCell);
            _.prevCell.set(cell);
            _.plotFlush = true;

            this.cells[3].set(_.fft.real.subarray(0, cellsize));
            this.cells[4].set(_.fft.imag.subarray(0, cellsize));
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

    fn.register("fft", FFTNode);

})(timbre);
