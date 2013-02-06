(function(T) {
    "use strict";
    
    function EfxDelay(opts) {
        var bits = Math.ceil(Math.log(T.samplerate * 1.5) * Math.LOG2E);
        
        this.cell = new T.fn.SignalArray(T.cellsize);
        
        this.time = 125;
        this.feedback  = 0.25;
        
        this.buffer = new T.fn.SignalArray(1 << bits);
        this.mask   = (1 << bits) - 1;
        this.wet    = 0.45;
        
        this.readIndex  = 0;
        this.writeIndex = (this.time / 1000 * T.samplerate)|0;
        
        if (opts) {
            this.setParams(opts);
        }
    }

    var $ = EfxDelay.prototype;
    
    $.setParams = function(opts) {
        if (opts.time) {
            this.time = opts.time;
            this.writeIndex = this.readIndex + ((this.time * 0.001 * T.samplerate)|0);
        }
        if (opts.feedback) {
            this.feedback = opts.feedback;
        }
        if (opts.wet) {
            this.wet = opts.wet;
        }
        return this;
    };
    
    $.process = function(_cell, overwrite) {
        var cell;
        var buffer, writeIndex, readIndex, feedback;
        var value, wet, dry;
        var i, imax;

        cell   = this.cell;
        buffer = this.buffer;
        writeIndex = this.writeIndex;
        readIndex  = this.readIndex;
        feedback   = this.feedback;
        wet = this.wet;
        dry = 1 - this.wet;
        
        for (i = 0, imax = cell.length; i < imax; ++i) {
            value = buffer[readIndex];
            buffer[writeIndex] = _cell[i] - (value * feedback);
            cell[i] = (_cell[i] * dry) + (value * wet);
            writeIndex += 1;
            readIndex  += 1;
        }

        if (overwrite) {
            for (i = 0; i < imax; ++i) {
                _cell[i] = cell[i];
            }
        }
        
        this.writeIndex = writeIndex & this.mask;
        this.readIndex  = readIndex  & this.mask;
        
        return cell;
    };
    
    T.modules.EfxDelay = EfxDelay;
    
})(timbre);
