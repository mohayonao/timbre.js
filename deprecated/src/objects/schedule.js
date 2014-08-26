(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function ScheduleNode(_args) {
        T.Object.call(this, 0, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        _.queue = [];
        _.currentTime = 0;
        _.maxRemain   = 1000;
    }
    fn.extend(ScheduleNode);

    var $ = ScheduleNode.prototype;

    Object.defineProperties($, {
        queue: {
            get: function() {
                return this._.queue;
            }
        },
        remain: {
            get: function() {
                return this._.queue.length;
            }
        },
        maxRemain: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.maxRemain = value;
                }
            },
            get: function() {
                return this._.maxRemain;
            }
        },
        isEmpty: {
            get: function() {
                return this._.queue.length === 0;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });

    $.sched = function(delta, item, args) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this.schedAbs(this._.currentTime + delta, item, args);
        }
        return this;
    };

    $.schedAbs = function(time, item, args) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number") {
            var _ = this._;
            var queue = _.queue;
            if (queue.length >= _.maxRemain) {
                return this;
            }
            for (var i = queue.length; i--; ) {
                if (queue[i][0] < time) {
                    break;
                }
            }
            queue.splice(i + 1, 0, [time, T(item), args]);
        }
        return this;
    };

    $.advance = function(delta) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this._.currentTime += delta;
        }
        return this;
    };

    $.clear = function() {
        this._.queue.splice(0);
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var emit = null;
            var queue = _.queue;

            if (queue.length) {
                while (queue[0][0] < _.currentTime) {
                    var nextItem = _.queue.shift();
                    nextItem[1].bang(nextItem[2]);
                    emit = "sched";
                    if (queue.length === 0) {
                        emit = "empty";
                        break;
                    }
                }
            }
            _.currentTime += fn.currentTimeIncr;
            if (emit) {
                _.emit(emit);
            }
        }
        return this;
    };

    fn.register("schedule", ScheduleNode);
    fn.alias("sched", "schedule");

})(timbre);
