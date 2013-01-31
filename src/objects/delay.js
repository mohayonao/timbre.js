(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var EfxDelay  = T.modules.EfxDelay;
    
    function DelayNode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.fb    = T(0.2);
        _.mix   = 0.33;
        _.delay = new EfxDelay();
        
        this.once("init", oninit);
    }
    fn.extend(DelayNode);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 100;
        }
    };
    
    var $ = DelayNode.prototype;
    
    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    if (0 < value && value < 15000) {
                        this._.time = value;
                        this._.delay.setParams({time:value});
                    }
                }
            },
            get: function() {
                return this._.time;
            }
        },
        fb: {
            set: function(value) {
                this._.fb = T(value);
            },
            get: function() {
                return this._.fb;
            }
        },
        mix: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.mix = value;
                }
            },
            get: function() {
                return this._.mix;
            }
        },
        wet: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.mix = value;
                }
            },
            get: function() {
                return this._.mix;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var fb  = _.fb.process(tickID)[0];
            var mix = _.mix;
            
            if (_.prevFb !== fb || _.prevMix !== mix) {
                _.prevFb  = fb;
                _.prevMix = mix;
                _.delay.setParams({feedback:fb, wet:mix});
            }
            
            if (!_.bypassed) {
                _.delay.process(cell, true);
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("delay", DelayNode);
    
})(timbre);
