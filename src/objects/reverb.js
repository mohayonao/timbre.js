(function(T) {
    "use strict";
    
    var fn = T.fn;
    var Reverb = T.modules.Reverb;
    
    function ReverbNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);
        
        this._.reverb = new Reverb(T.samplerate, T.cellsize);
    }
    fn.extend(ReverbNode);
    
    var $ = ReverbNode.prototype;
    
    Object.defineProperties($, {
        room: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.setRoomSize(value);
                }
            },
            get: function() {
                return this._.reverb.roomsize;
            }
        },
        damp: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.setDamp(value);
                }
            },
            get: function() {
                return this._.reverb.damp;
            }
        },
        mix: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.wet = value;
                }
            },
            get: function() {
                return this._.reverb.wet;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            if (!_.bypassed) {
                _.reverb.process(cell);
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    fn.register("reverb", ReverbNode);
    
})(timbre);
