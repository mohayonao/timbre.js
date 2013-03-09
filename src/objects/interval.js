(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function IntervalNode(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        _.interval = T(1000);
        _.count = 0;
        _.delay   = 0;
        _.timeout = Infinity;
        _.currentTime = 0;
        _.delaySamples = 0;
        _.countSamples = 0;
        _.onended = fn.make_onended(this);

        this.on("start", onstart);
    }
    fn.extend(IntervalNode);

    var onstart = function() {
        var _ = this._;
        this.playbackState = fn.PLAYING_STATE;
        _.delaySamples = (_.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });

    var $ = IntervalNode.prototype;

    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    }
                }
                this._.interval = T(value);
            },
            get: function() {
                return this._.interval;
            }
        },
        delay: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this._.delay = value;
                    this._.delaySamples = (this._.samplerate * (value * 0.001))|0;
                }
            },
            get: function() {
                return this._.delay;
            }
        },
        count: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.count = value;
                }
            },
            get: function() {
                return this._.count;
            }
        },
        timeout: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this._.timeout = value;
                }
            },
            get: function() {
                return this._.timeout;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        this.playbackState = fn.PLAYING_STATE;
        _.delaySamples = (_.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];

        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }

            var interval = _.interval.process(tickID).cells[0][0];

            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (_.samplerate * interval * 0.001)|0;
                    var nodes = this.nodes;
                    var count  = _.count;
                    var x = count * _.mul + _.add;
                    for (var j = 0, jmax = cell.length; j < jmax; ++j) {
                        cell[j] = x;
                    }
                    for (var i = 0, imax = nodes.length; i < imax; ++i) {
                        nodes[i].bang(count);
                    }
                    _.count += 1;
                }
            }
            _.currentTime += fn.currentTimeIncr;

            if (_.currentTime >= _.timeout) {
                fn.nextTick(_.onended);
            }
        }
        return this;
    };

    fn.register("interval", IntervalNode);

})(timbre);
