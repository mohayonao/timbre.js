(function(timbre) {
    "use strict";
    
    var FFT = timbre.utils.FFT;
    
    function IFFT(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this._.fft = new FFT(timbre.cellsize * 2);
        this._.fftCell    = new Float32Array(this._.fft.length);
        this._.realBuffer = new Float32Array(this._.fft.length);
        this._.imagBuffer = new Float32Array(this._.fft.length);
    }
    timbre.fn.extend(IFFT);
    
    var $ = IFFT.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.real && _.imag) {
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.seq(seq_id);
                var _imag = _.imag.seq(seq_id);
                var j, jmax = cell.length;
                var mul = _.mul, add = _.add;
                
                real.set(_real);
                imag.set(_imag);
                
                cell.set(_.fft.inverse(real, imag).subarray(0, cell.length));
                
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("ifft", IFFT);

})(timbre);
