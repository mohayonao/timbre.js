(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function EfxDistortion(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this.once("init", oninit);
    }
    fn.extend(EfxDistortion);
    
    var oninit = function() {
        if (!this._.preGain) {
            this.preGain = -60;
        }
        if (!this._.postGain) {
            this.postGain = 18;
        }
    };
    
    var $ = EfxDistortion.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            fn.inputSignalAR(this);
            
            var changed = false;

            var preGain = _.preGain.seq(seq_id)[0];
            if (_.prevPreGain !== preGain) {
                _.prevPreGain = preGain;
                changed = true;
            }
            var postGain = _.postGain.seq(seq_id)[0];
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
    
    fn.register("efx.dist", EfxDistortion);
})(timbre);
