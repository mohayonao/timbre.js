(function(timbre) {
    "use strict";

    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var EfxDelay  = timbre.modules.EfxDelay;
    
    function EfxDelayNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this._.delay = new EfxDelay();
        
        this.once("init", oninit);
    }
    fn.extend(EfxDelayNode);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 100;
        }
        if (!this._.feedback) {
            this.feedback = 0.25;
        }
        if (!this._.wet) {
            this.wet = 0.2;
        }
    };
    
    var $ = EfxDelayNode.prototype;
    
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
        feedback: {
            set: function(value) {
                this._.feedback = timbre(value);
            },
            get: function() {
                return this._.feedback;
            }
        },
        wet: {
            set: function(value) {
                this._.wet = timbre(value);
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
            
            var changed = false;
            var feedback = _.feedback.process(tickID)[0];
            if (_.prevFeedback !== feedback) {
                _.prevFeedback = feedback;
                changed = true;
            }
            var wet = _.wet.process(tickID)[0];
            if (_.prevWet !== wet) {
                _.prevWet = wet;
                changed = true;
            }
            if (changed) {
                _.delay.setParams({feedback:feedback, wet:wet});
            }
            
            _.delay.process(cell, true);
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("efx.delay", EfxDelayNode);
    
})(timbre);
