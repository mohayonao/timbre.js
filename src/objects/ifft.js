(function(timbre) {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    
    function IFFTNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this._.fft = new FFT(timbre.cellsize * 2);
        this._.fftCell    = new Float32Array(this._.fft.length);
        this._.realBuffer = new Float32Array(this._.fft.length);
        this._.imagBuffer = new Float32Array(this._.fft.length);
    }
    fn.extend(IFFTNode);
    
    var $ = IFFTNode.prototype;
    
    Object.defineProperties($, {
        real: {
            set: function(value) {
                this._.real = timbre(value);
            },
            get: function() {
                return this._.real;
            }
        },
        imag: {
            set: function(value) {
                this._.imag = timbre(value);
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
