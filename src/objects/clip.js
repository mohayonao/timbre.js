(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function Clip(_args) {
        timbre.Object.call(this, _args);
        
        this._.lv = 0.8;
    }
    fn.extend(Clip);
    
    var $ = Clip.prototype;
    
    Object.defineProperties($, {
        lv: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.lv = Math.abs(value);
                }
            },
            get: function() {
                return this._.lv;
            }
        }
    });
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var lv = _.lv;
            var tmp, x;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                for (j = jmax; j--; ) {
                    x = cell[j];
                    x = (x < -lv) ? -lv : (x > lv) ? lv : x;
                    cell[j] = x;
                }
                
                if (mul !== 1 || add !== 0) {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {    // control-rate
                tmp = 0;
                for (i = 0; i < imax; ++i) {
                    tmp += inputs[i].seq(seq_id)[0];
                }
                tmp = (tmp < -lv) ? -lv : (tmp > lv) ? lv : tmp;
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    fn.register("clip", Clip);
    
})(timbre);
