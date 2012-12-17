(function(timbre) {
    "use strict";
    
    function ObjectTemplate(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(ObjectTemplate, timbre.Object);
    
    var $ = ObjectTemplate.prototype;
    
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
            
            
            // audio processing
            
            
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("object-template", ObjectTemplate);
})(timbre);
