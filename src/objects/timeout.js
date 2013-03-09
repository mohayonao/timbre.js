(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function TimeoutNode(_args) {
        T.Object.call(this, 0, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.currentTime = 0;
        _.samplesMax = 0;
        _.samples    = 0;
        _.onended = fn.make_onended(this);

        this.once("init", oninit);
        this.on("start", onstart);
    }

    fn.extend(TimeoutNode);

    var oninit = function() {
        if (!this._.timeout) {
            this.timeout = 1000;
        }
    };

    var onstart = function() {
        this.playbackState = fn.PLAYING_STATE;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });

    var $ = TimeoutNode.prototype;

    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this.playbackState = fn.PLAYING_STATE;
                    _.timeout = value;
                    _.samplesMax = (_.samplerate * (value * 0.001))|0;
                    _.samples = _.samplesMax;
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
        _.samples = _.samplesMax;
        _.currentTime = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.samples > 0) {
                _.samples -= cell.length;
            }

            if (_.samples <= 0) {
                var nodes = this.nodes;
                for (var i = 0, imax = nodes.length; i < imax; ++i) {
                    nodes[i].bang();
                }
                fn.nextTick(_.onended);
            }
            _.currentTime += fn.currentTimeIncr;
        }
        return this;
    };

    fn.register("timeout", TimeoutNode);

})(timbre);
