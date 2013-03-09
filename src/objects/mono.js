(function(T) {
    "use strict";

    var fn  = T.fn;

    function MonoNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(MonoNode);

    MonoNode.prototype.process = function(tickID) {
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
    fn.register("mono", MonoNode);

})(timbre);
