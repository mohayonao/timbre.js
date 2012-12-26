(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function EfxDistNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this.once("init", oninit);
    }
    fn.extend(EfxDistNode);
    
    var oninit = function() {
        if (!this._.preGain) {
            this.preGain = -60;
        }
        if (!this._.postGain) {
            this.postGain = 18;
        }
    };
    
    var $ = EfxDistNode.prototype;
    
    Object.defineProperties($, {
        preGain: {
            set: function(value) {
                this._.preGain = timbre(value);
            },
            get: function() {
                return this._.preGain;
            }
        },
        postGain: {
            set: function(value) {
                this._.postGain = timbre(value);
            },
            get: function() {
                return this._.postGain;
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

            var preGain = _.preGain.process(tickID)[0];
            if (_.prevPreGain !== preGain) {
                _.prevPreGain = preGain;
                changed = true;
            }
            var postGain = _.postGain.process(tickID)[0];
            if (_.prevPostGain !== postGain) {
                _.prevPostGain = postGain;
                changed = true;
            }
            if (changed) {
                var postScale = Math.pow(2, -postGain * 0.166666666);
                _.preScale = Math.pow(2, -preGain * 0.166666666) * postScale;
                _.limit = postScale;
            }
            
            var preScale = _.preScale;
            var limit    = _.limit;
            var mul = _.mul, add = _.add;
            var x;
            
            for (var i = cell.length; i--; ) {
                x = cell[i] * preScale;
                x = (x > limit) ? limit : (x < -limit) ? -limit : x;
                cell[i] = x * mul + add;
            }
        }
        
        return cell;
    };
    
    fn.register("efx.dist", EfxDistNode);
    
})(timbre);
