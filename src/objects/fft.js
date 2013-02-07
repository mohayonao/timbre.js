(function(T) {
    "use strict";
    
    var fn  = T.fn;
    var FFT = T.modules.FFT;
    
    function FFTNode(_args) {
        T.Object.call(this, 1, _args);
        fn.listener(this);
        fn.fixAR(this);
        
        this.real = this.L;
        this.imag = this.R;

        var _ = this._;
        _.fft = new FFT(T.cellsize * 2);
        _.fftCell  = new fn.SignalArray(_.fft.length);
        _.prevCell = new fn.SignalArray(T.cellsize);
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
            
            var cell = this.cells[0];
            
            _.fftCell.set(_.prevCell);
            _.fftCell.set(cell, cell.length);
            _.fft.forward(_.fftCell);
            _.prevCell.set(cell);
            
            var real = this.cells[1];
            var imag = this.cells[2];
            var _real = _.fft.real;
            var _imag = _.fft.imag;
            
            for (var i = 0, imax = cell.length; i < imax; ++i) {
                real[i] = _real[i];
                imag[i] = _imag[i];
            }
            
            this._.plotFlush = true;
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
