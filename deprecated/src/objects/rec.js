(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    var STATUS_WAIT = 0;
    var STATUS_REC  = 1;

    function RecNode(_args) {
        T.Object.call(this, 1, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.timeout    = 5000;
        _.status     = STATUS_WAIT;
        _.writeIndex = 0;
        _.writeIndexIncr  = 1;
        _.currentTime     = 0;
        _.currentTimeIncr = 1000 / _.samplerate;
        _.onended = make_onended(this);
    }
    fn.extend(RecNode);

    var make_onended = function(self) {
        return function() {
            var _ = self._;

            var buffer = new fn.SignalArray(_.buffer.subarray(0, _.writeIndex|0));

            _.status      = STATUS_WAIT;
            _.writeIndex  = 0;
            _.currentTime = 0;

            _.emit("ended", {
                buffer:buffer, samplerate:_.samplerate
            });
        };
    };

    var $ = RecNode.prototype;

    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    this._.timeout = value;
                }
            },
            get: function() {
                return this._.timeout;
            }
        },
        samplerate: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 < value && value <= this._.samplerate) {
                        this._.samplerate = value;
                    }
                }
            },
            get: function() {
                return this._.samplerate;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });

    $.start = function() {
        var _ = this._, len;
        if (_.status === STATUS_WAIT) {
            len = (_.timeout * 0.01 * _.samplerate)|0;
            if (!_.buffer || _.buffer.length < len) {
                _.buffer = new fn.SignalArray(len);
            }
            _.writeIndex = 0;
            _.writeIndexIncr = _.samplerate / T.samplerate;
            _.currentTime = 0;
            _.status = STATUS_REC;
            _.emit("start");
            this.listen();
        }
        return this;
    };

    $.stop = function() {
        var _ = this._;
        if (_.status === STATUS_REC) {
            _.status = STATUS_WAIT;
            _.emit("stop");
            fn.nextTick(_.onended);
            this.unlisten();
        }
        return this;
    };

    $.bang = function() {
        if (this._.status === STATUS_WAIT) {
            this.srart();
        } else if (this._.status === STATUS_REC) {
            this.stop();
        }
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cells[0];

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (_.status === STATUS_REC) {
                var i, imax = cell.length;
                var buffer  = _.buffer;
                var timeout = _.timeout;
                var writeIndex      = _.writeIndex;
                var writeIndexIncr  = _.writeIndexIncr;
                var currentTime     = _.currentTime;
                var currentTimeIncr = _.currentTimeIncr;

                for (i = 0; i < imax; ++i) {
                    buffer[writeIndex|0] = cell[i];
                    writeIndex += writeIndexIncr;

                    currentTime += currentTimeIncr;
                    if (timeout <= currentTime) {
                        fn.nextTick(_.onended);
                    }
                }
                _.writeIndex  = writeIndex;
                _.currentTime = currentTime;
            }

            fn.outputSignalAR(this);
        }
        return this;
    };

    fn.register("record", RecNode);
    fn.alias("rec", "record");

})(timbre);
