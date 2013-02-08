(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function AddNode(_args) {
        T.Object.call(this, 2, _args);
    }
    fn.extend(AddNode);
    
    var $ = AddNode.prototype;
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.ar) {
                fn.inputSignalAR(this);
                fn.outputSignalAR(this);
            } else {
                this.cells[0][0] = fn.inputSignalKR(this);
                fn.outputSignalKR(this);
            }
        }
        
        return this;
    };
    
    fn.register("+", AddNode);
    
})(timbre);
