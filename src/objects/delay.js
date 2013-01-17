(function() {
    "use strict";

    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var EfxDelay  = timbre.modules.EfxDelay;
    
    function DelayNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this.attrs[ATTRS_FB]  = timbre(0);
        this.attrs[ATTRS_WET] = timbre(1);
        
        this._.delay = new EfxDelay();
        
        this.once("init", oninit);
    }
    fn.extend(DelayNode);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 100;
        }
    };
    
    var $ = DelayNode.prototype;
    
    var ATTRS_FB  = fn.setAttrs($, ["feedback", "fb"]);
    var ATTRS_WET = fn.setAttrs($, "wet");
    
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
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;
            var feedback = this.attrs[ATTRS_FB].process(tickID)[0];
            if (_.prevFeedback !== feedback) {
                _.prevFeedback = feedback;
                changed = true;
            }
            var wet = this.attrs[ATTRS_WET].process(tickID)[0];
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
