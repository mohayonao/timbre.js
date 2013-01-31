(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function DivNode(_args) {
        T.Object.call(this, _args);
    }
    fn.extend(DivNode);
    
    var $ = DivNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp, div;
            
            if (_.ar) {
                if (inputs.length > 0) {
                    tmp = inputs[0].process(tickID);
                    cell.set(tmp);
                    for (i = 1; i < imax; ++i) {
                        tmp = inputs[i].process(tickID);
                        for (j = jmax; j--; ) {
                            div = tmp[j];
                            cell[j] = (div === 0) ? 0 : cell[j] / div;
                        }
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (inputs.length > 0) {
                    tmp = inputs[0].process(tickID)[0];
                    for (i = 1; i < imax; ++i) {
                        div = inputs[i].process(tickID)[0];
                        tmp = (div === 0) ? 0 : tmp / div;
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
    
    fn.register("/", DivNode);
    
})(timbre);
