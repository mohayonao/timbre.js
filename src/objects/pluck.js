(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function PluckNode(_args) {
        T.Object.call(this, _args);
        
        this._.freq   = 440;
        this._.buffer = null;
        this._.readIndex  = 0;
        this._.writeIndex = 0;
    }
    fn.extend(PluckNode);
    
    var $ = PluckNode.prototype;

    Object.defineProperties($, {
        freq: {
            set: function(value) {
                if (typeof value === "number") {
                    if (value < 0) {
                        value = 0;
                    }
                    this._.freq = value;
                }
            },
            get: function() {
                return this._.freq;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        var freq   = _.freq;
        var size   = (T.samplerate / freq + 0.5)|0;
        var buffer = _.buffer = fn.getSignalArray(size << 1);
        for (var i = 0; i < size; ++i) {
            buffer[i] = Math.random() * 2 - 1;
        }
        _.readIndex  = 0;
        _.writeIndex = size;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var buffer = _.buffer;
            if (buffer) {
                var bufferLength = buffer.length;
                var readIndex  = _.readIndex;
                var writeIndex = _.writeIndex;
                var mul = _.mul, add = _.add;
                var x, i, imax = cell.length;
                
                for (i = 0; i < imax; ++i) {
                    x = buffer[readIndex++];
                    if (readIndex >= bufferLength) {
                        readIndex = 0;
                    }
                    x = (x + buffer[readIndex]) * 0.5;
                    buffer[writeIndex++] = x;
                    if (writeIndex >= bufferLength) {
                        writeIndex = 0;
                    }
                    cell[i] = x * mul + add;
                }
                _.readIndex  = readIndex;
                _.writeIndex = writeIndex;
            }
        }
        
        return cell;
    };
    
    fn.register("pluck", PluckNode);
    
})(timbre);
