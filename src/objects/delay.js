(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var EfxDelay  = T.modules.EfxDelay;
    
    function DelayNode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.fb    = T(0);
        _.wet   = T(1);
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
        wet: {
            set: function(value) {
                this._.wet = T(value);
            },
            get: function() {
                return this._.wet;
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
            var wet = _.wet.process(tickID)[0];

            if (_.prevFb !== fb || _.prevWet !== wet) {
                _.prevFb  = fb;
                _.prevWet = wet;
                _.delay.setParams({feedback:fb, wet:wet});
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
