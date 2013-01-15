(function() {
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

    var ATTRS_REAL = fn.setAttrs($, "real");
    var ATTRS_IMAG = fn.setAttrs($, "imag");
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (this.attrs[ATTRS_REAL] && this.attrs[ATTRS_IMAG]) {
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = this.attrs[ATTRS_REAL].process(tickID);
                var _imag = this.attrs[ATTRS_IMAG].process(tickID);
                
                real.set(_real);
                imag.set(_imag);
                
                cell.set(_.fft.inverse(real, imag).subarray(0, cell.length));
                
                fn.outputSignalAR(this);
            }
        }
        
        return cell;
    };
    
    fn.register("ifft", IFFTNode);

})();
