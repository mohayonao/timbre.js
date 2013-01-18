(function() {
    "use strict";

    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var EfxDelay  = timbre.modules.EfxDelay;
    
    function DelayNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.fb    = timbre(0);
        _.wet   = timbre(1);
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
                this._.fb = timbre(value);
            },
            get: function() {
                return this._.fb;
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
            var feedback = _.fb.process(tickID)[0];
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
    
    fn.register("delay", DelayNode);
    
})();
