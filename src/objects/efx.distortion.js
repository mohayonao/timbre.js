(function(timbre) {
    "use strict";
    
    function EfxDistortion(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this.once("init", oninit);
    }
    timbre.fn.extend(EfxDistortion, timbre.Object);
    
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
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
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
            var x;
            
            for (j = jmax; j--; ) {
                x = cell[j] * preScale;
                x = (x > limit) ? limit : (x < -limit) ? -limit : x;
                cell[j] = x * mul + add;
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("efx.dist", EfxDistortion);
})(timbre);
