(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function LagNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        var bits = Math.ceil(Math.log(_.samplerate) * Math.LOG2E);
        _.buffersize = 1 << bits;
        _.buffermask = _.buffersize - 1;
        _.buffer = new fn.SignalArray(_.buffersize);
        _.time = 0;
        _.readIndex  = 0;
        _.writeIndex = 0;
    }
    fn.extend(LagNode);

    var $ = LagNode.prototype;

    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    var _ = this._;
                    _.time = value;
                    var offset = (value * 0.001 * _.samplerate)|0;
                    if (offset > _.buffermask) {
                        offset = _.buffermask;
                    }
                    _.writeIndex = (_.readIndex + offset) & _.buffermask;
                }
            },
            get: function() {
                return this._.time;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var cell = this.cells[0];
            var buffer = _.buffer;
            var mask   = _.buffermask;
            var readIndex  = _.readIndex;
            var writeIndex = _.writeIndex;
            var i, imax = cell.length;

            for (i = 0; i < imax; ++i) {
                buffer[writeIndex] = cell[i];
                cell[i] = buffer[readIndex];

                readIndex  += 1;
                writeIndex = (writeIndex + 1) & mask;
            }

            _.readIndex  = readIndex & mask;
            _.writeIndex = writeIndex;

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("lag", LagNode);

})(timbre);
