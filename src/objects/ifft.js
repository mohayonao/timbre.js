(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;

    function IFFTNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.fft = new FFT(_.cellsize * 2);
        _.fftCell    = new fn.SignalArray(this._.fft.length);
        _.realBuffer = new fn.SignalArray(this._.fft.length);
        _.imagBuffer = new fn.SignalArray(this._.fft.length);
    }
    fn.extend(IFFTNode);

    var $ = IFFTNode.prototype;

    Object.defineProperties($, {
        real: {
            set: function(value) {
                this._.real = T(value);
            },
            get: function() {
                return this._.real;
            }
        },
        imag: {
            set: function(value) {
                this._.imag = T(value);
            },
            get: function() {
                return this._.imag;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.real && _.imag) {
                var cell = this.cells[0];
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.process(tickID).cells[0];
                var _imag = _.imag.process(tickID).cells[0];

                real.set(_real);
                imag.set(_imag);

                cell.set(_.fft.inverse(real, imag).subarray(0, _.cellsize));

                fn.outputSignalAR(this);
            }
        }

        return this;
    };

    fn.register("ifft", IFFTNode);

})(timbre);
