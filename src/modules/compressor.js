(function(T) {
    "use strict";
    
    function Compressor(samplerate) {
        this.samplerate = samplerate;
        
        this.dbThreshold = -24;
        this.dbKnee  = 0; // not implemented
        this.dbRatio = 12;
        
        this.setParams(this.dbThreshold, this.dbKnee, this.dbRatio);
    }
    
    var $ = Compressor.prototype;
    
    $.setParams = function(dbThreshold, dbKnee, dbRatio) {
        this.dbThreshold = dbThreshold;
        this.threshold = Math.pow(10, 0.05 * this.dbThreshold);
        this.dbRatio = dbRatio;
        this.ratio = Math.pow(10, 0.05 * this.dbRatio);
        this.slope = 1 / this.ratio;
        this.gain = 1 / (this.threshold + (1 - this.threshold) * this.slope);
    };
    
    $.process = function(cellL, cellR) {
        var threshold = this.threshold;
        var slope = this.slope;
        var gain = this.gain;
        var x, xL, xR;
        
        var i, imax = cellL.length;
        for (i = 0; i < imax; ++i) {
            xL = cellL[i];
            xR = cellR[i];
            x  = (xL + xR) * 0.5;
            if (threshold > x) {
                xL = threshold + (xL - threshold) * slope;
                xR = threshold + (xR - threshold) * slope;
            } else if (x < -threshold) {
                xL = -threshold + (xL + threshold) * slope;
                xR = -threshold + (xR + threshold) * slope;
            }
            cellL[i] = xL * gain;
            cellL[i] = xR * gain;
        }
    };
    
    T.modules.Compressor = Compressor;
    
})(timbre);
