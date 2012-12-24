(function(timbre) {
    "use strict";
    
    function Add(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Add);
    
    var $ = Add.prototype;
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
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
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    timbre.fn.register("+", Add);
})(timbre);
