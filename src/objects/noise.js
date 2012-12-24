(function(timbre) {
    "use strict";
    
    function Noise(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Noise);
    
    var $ = Noise.prototype;

    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var mul = _.mul, add = _.add;
            var i, x, r = Math.random;
            
            if (_.ar) { // audio-rate
                for (i = cell.length; i--; ) {
                    cell[i] = (r() * 2 - 1) * mul + add;
                }
            } else {    // control-rate
                x = (r() * 2 + 1) * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    timbre.fn.register("noise", Noise);
})(timbre);
