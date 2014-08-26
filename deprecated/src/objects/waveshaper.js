(function(T) {
    "use strict";

    var fn = T.fn;

    function WaveShaperNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        this._.curve = null;
    }
    fn.extend(WaveShaperNode);

    var $ = WaveShaperNode.prototype;

    Object.defineProperties($, {
        curve: {
            set: function(value) {
                if (fn.isSignalArray(value)) {
                    this._.curve = value;
                }
            },
            get: function() {
                return this._.curve;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (_.curve) {
                var cell = this.cells[0];
                var curve = _.curve;
                var len    = curve.length;
                var x, i, imax = _.cellsize;
                for (i = 0; i < imax; ++i) {
                    x = (((cell[i] + 1) * 0.5) * len + 0.5)|0;
                    if (x < 0) {
                        x = 0;
                    } else if (x >= len - 1) {
                        x = len - 1;
                    }
                    cell[i] = curve[x];
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("waveshaper", WaveShaperNode);

})(timbre);
