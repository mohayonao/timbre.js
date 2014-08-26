(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function ScopeNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.samples    = 0;
        _.writeIndex = 0;
        _.plotFlush = true;

        this.once("init", oninit);
    }
    fn.extend(ScopeNode);

    var oninit = function() {
        if (!this._.buffer) {
            this.size = 1024;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
    };

    var $ = ScopeNode.prototype;

    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.buffer) {
                    if (typeof value === "number") {
                        var n = (value < 64) ? 64 : (value > 2048) ? 2048 : value;
                        _.buffer = new fn.SignalArray(n);
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval    = value;
                        _.samplesIncr = value * 0.001 * _.samplerate / _.buffer.length;
                        if (_.samplesIncr < 1) {
                            _.samplesIncr = 1;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        },
        buffer: {
            get: function() {
                return this._.buffer;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        var buffer = _.buffer;

        for (var i = 0, imax = buffer.length; i < imax; ++i) {
            buffer[i] = 0;
        }
        _.samples    = 0;
        _.writeIndex = 0;
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var i, imax = _.cellsize;
            var samples     = _.samples;
            var samplesIncr = _.samplesIncr;
            var buffer      = _.buffer;
            var writeIndex  = _.writeIndex;
            var emit = false;
            var bufferlength = buffer.length;

            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[i];
                    if (writeIndex >= bufferlength) {
                        writeIndex = 0;
                    }
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;

            if (emit) {
                this._.emit("data");
            }
        }

        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var buffer = _.buffer;
            var mask   = buffer.length - 1;
            var data   = new Float32Array(buffer.length);
            var j = _.writeIndex;
            for (var i = 0, imax = buffer.length; i < imax; i++) {
                data[i] = buffer[++j & mask];
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("scope", ScopeNode);

})(timbre);
