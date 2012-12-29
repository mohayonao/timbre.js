(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function ScheduleNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.queue = [];
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        _.maxSize = 1000;
    }
    fn.extend(ScheduleNode);
    
    var $ = ScheduleNode.prototype;
    
    Object.defineProperties($, {
        queue: {
            get: function() {
                return this._.queue;
            }
        },
        size: {
            get: function() {
                return this._.queue.length;
            }
        },
        maxSize: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.maxSize = value;
                }
            },
            get: function() {
                return this._.maxSize;
            }
        },
        isEmpty: {
            get: function() {
                return this._.queue.length === 0;
            }
        }
    });
    
    $.sched = function(delta, item) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this.schedAbs(this._.currentTime + delta, item);
        }
        return this;
    };
    
    $.schedAbs = function(time, item) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number") {
            var _ = this._;
            var list = _.queue;
            if (list.length >= _.maxSize) {
                return this;
            }
            for (var i = list.length; i--; ) {
                if (list[i][0] < time) {
                    break;
                }
            }
            list.splice(i + 1, 0, [time, timbre(item)]);
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
        var cell = this.cell;
        var _ = this._;

        if (_.isEnded) {
            return cell;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var emit = null;
            var list = _.queue;
            
            if (list.length) {
                while (list[0][0] < _.currentTime) {
                    var nextItem = _.queue.shift();
                    nextItem[1].bang(); // TODO: args?
                    emit = "sched";
                    if (list.length === 0) {
                        emit = "empty";
                        break;
                    }
                }
            }
            _.currentTime += _.currentTimeIncr;
            if (emit) {
                _.emit(emit);
            }
        }
    };
    
    fn.register("schedule", ScheduleNode);
    fn.alias("sche", "schedule");
    
})(timbre);
