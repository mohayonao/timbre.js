(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function AddNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(AddNode);
    
    var $ = AddNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.ar) {
                fn.inputSignalAR(this);
                fn.outputSignalAR(this);
            } else {
                cell[0] = fn.inputSignalKR(this);
                fn.outputSignalKR(this);
            }
        }
        return cell;
    };
    
    fn.register("+", AddNode);
    
})(timbre);
