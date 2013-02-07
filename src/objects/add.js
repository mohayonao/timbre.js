(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function AddNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(AddNode);
    
    var $ = AddNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cells[0];
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
        return this;
    };
    
    fn.register("+", AddNode);
    
})(timbre);
