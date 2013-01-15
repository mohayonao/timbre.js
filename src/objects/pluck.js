(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue  = timbre.timevalue;
    
    function PluckNode(_args) {
        timbre.Object.call(this, _args);
        
        this.attrs[ATTRS_FREQ] = timbre(440);
        
        this._.buffer = null;
        this._.readIndex  = 0;
        this._.writeIndex = 0;
    }
    fn.extend(PluckNode);
    
    var $ = PluckNode.prototype;
    
    var ATTRS_FREQ = fn.setAttrs($, ["freq", "frequency"], {
        conv: function(value) {
            if (typeof value === "string") {
                value = timevalue(value);
                if (value <= 0) {
                    return 0;
                }
                return 1000 / value;
            }
            return value;
        }
    });
    
    $.bang = function() {
        var _ = this._;
        var freq = this.attrs[ATTRS_FREQ].valueOf();
        var size   = (timbre.samplerate / freq + 0.5)|0;
        var buffer = _.buffer = new Float32Array(size << 1);
        for (var i = size; i--; ) {
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
    
})();
