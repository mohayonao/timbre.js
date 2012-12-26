(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function NoiseNode(_args) {
        timbre.Object.call(this, _args);
    }
    fn.extend(NoiseNode);
    
    var $ = NoiseNode.prototype;

    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
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
    
    fn.register("noise", NoiseNode);
    
})(timbre);
