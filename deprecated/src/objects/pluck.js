(function(T) {
    "use strict";

    var fn = T.fn;

    function PluckNode(_args) {
        T.Object.call(this, 1, _args);

        this._.freq   = 440;
        this._.buffer = null;
        this._.index  = 0;
    }
    fn.extend(PluckNode);

    var $ = PluckNode.prototype;

    Object.defineProperties($, {
        freq: {
            set: function(value) {
                if (typeof value === "number") {
                    if (value < 0) {
                        value = 0;
                    }
                    this._.freq = value;
                }
            },
            get: function() {
                return this._.freq;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        var freq   = _.freq;
        var size   = (_.samplerate / freq + 0.5)|0;
        var buffer = _.buffer = new fn.SignalArray(size);
        for (var i = 0; i < size; ++i) {
            buffer[i] = Math.random() * 2 - 1;
        }
        _.index = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var buffer = _.buffer;
            if (buffer) {
                var bufferLength = buffer.length;
                var index = _.index, write;
                var mul = _.mul, add = _.add;
                var x, i, imax = cell.length;

                for (i = 0; i < imax; ++i) {
                    write = index;
                    x = buffer[index++];
                    if (index >= bufferLength) {
                        index = 0;
                    }
                    x = (x + buffer[index]) * 0.5;
                    buffer[write] = x;
                    cell[i] = x * mul + add;
                }
                _.index = index;
            }
        }

        return this;
    };

    fn.register("pluck", PluckNode);

})(timbre);
