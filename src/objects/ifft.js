(function(T) {
    "use strict";
    
    var fn  = T.fn;
    var FFT = T.modules.FFT;
    
    function IFFTNode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;
        _.fft = new FFT(T.cellsize * 2);
        _.fftCell    = fn.getSignalArray(this._.fft.length);
        _.realBuffer = fn.getSignalArray(this._.fft.length);
        _.imagBuffer = fn.getSignalArray(this._.fft.length);
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
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.real && _.imag) {
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.process(tickID);
                var _imag = _.imag.process(tickID);
                
                real.set(_real);
                imag.set(_imag);
                
                cell.set(_.fft.inverse(real, imag).subarray(0, cell.length));
                
                fn.outputSignalAR(this);
            }
        }
        
        return cell;
    };
    
    fn.register("ifft", IFFTNode);

})(timbre);
