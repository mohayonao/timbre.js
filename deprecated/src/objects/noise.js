(function(T) {
    "use strict";

    var fn = T.fn;

    function NoiseNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(NoiseNode);

    var $ = NoiseNode.prototype;

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var mul = _.mul, add = _.add;
            var i, imax, x;

            if (_.ar) { // audio-rate
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (Math.random() * 2 - 1) * mul + add;
                }
            } else {    // control-rate
                x = (Math.random() * 2 + 1) * mul + add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x;
                }
            }
        }
        return this;
    };

    fn.register("noise", NoiseNode);

})(timbre);
