(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function MaxNode(_args) {
        T.Object.call(this, _args);
    }
    fn.extend(MaxNode);
    
    var $ = MaxNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp, val;
            
            if (_.ar) {
                if (inputs.length > 0) {
                    tmp = inputs[0].process(tickID);
                    cell.set(tmp);
                    for (i = 1; i < imax; ++i) {
                        tmp = inputs[i].process(tickID);
                        for (j = 0; j < jmax; ++j) {
                            val = tmp[j];
                            if (cell[j] < val) {
                                cell[j] = val;
                            }
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cell[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (inputs.length > 0) {
                    tmp = inputs[0].process(tickID)[0];
                    for (i = 1; i < imax; ++i) {
                        val = inputs[i].process(tickID)[0];
                        if (tmp < val) {
                            tmp = val;
                        }
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }
        
        return cell;
    };
    
    fn.register("max", MaxNode);
    
})(timbre);
