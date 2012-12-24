(function(timbre) {
    "use strict";

    var timevalue = timbre.utils.timevalue;

    var TYPE_TIMER    = 0;
    var TYPE_INTERVAL = 1;
    
    function Interval(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.timer(this);
        timbre.fn.fixKR(this);
        
        this._.count = 0;
        this._.timeout = Infinity;
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.delaySamples = 0;
        this._.countSamples = 0;
        this._.isEnded = false;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    timbre.fn.extend(Interval);
    
    var oninit = function() {
        if (this._.originkey === "timer") {
            this._.type = TYPE_TIMER;
            timbre.fn.deferred(this);
        } else {
            this._.type = TYPE_INTERVAL;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
        if (this._.delay === undefined) {
            if (this._.originkey === "interval") {
                this.delay = this.interval.valueOf();
            } else {
                this.delay = 0;
            }
        }
    };
    
    var onstart = function() {
        this._.currentTime = 0;
        this._.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    
    var $ = Interval.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                this._.interval = timbre(value);
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
                    this._.delaySamples = (timbre.samplerate * (value * 0.001))|0;
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
        _.currentTime = 0;
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        
        var _ = this._;
        
        if (_.isEnded) {
            return cell;
        }
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }
            _.interval.seq(seq_id);
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * _.interval.valueOf() * 0.001)|0;
                    var inputs = this.inputs;
                    var count  = _.count;
                    var x = count * _.mul + _.add;
                    for (var j = cell.length; j--; ) {
                        cell[j] = x;
                    }
                    for (var i = 0, imax = inputs.length; i < imax; ++i) {
                        inputs[i].bang(count);
                    }
                    _.count += 1;
                }
            }
            _.currentTime += _.currentTimeIncr;

            if (_.currentTime >= _.timeout) {
                timbre.fn.nextTick(onended.bind(this));
            }
        }
        return cell;
    };
    
    var onended = function() {
        var _ = this._;
        _.isEnded = true;
        if (_.type === TYPE_TIMER && !this.isResolved) {
            var stop = this.stop;
            this.start = this.stop = timbre.fn.nop;
            _.emit("ended");
            _.deferred.resolve();
            stop.call(this);
        } else {
            this.stop();
            _.emit("ended");
        }
    };
    
    timbre.fn.register("interval", Interval);
    timbre.fn.alias("interval0", "interval");
    timbre.fn.alias("timer", "interval");
    
})(timbre);
