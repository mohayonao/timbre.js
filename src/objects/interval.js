(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function IntervalNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.count = 0;
        _.timeout = Infinity;
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        _.delaySamples = 0;
        _.countSamples = 0;
        _.isEnded = false;
        
        this.once("init", oninit);
        this.on("start", onstart);
        
        if (_.deferred) {
            fn.deferred(this);
            this.on("stop", onstop);
        }
    }
    fn.extend(IntervalNode);
    
    var oninit = function() {
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
    var onstop = function() {
        var _ = this._;
        if (_.deferred && !this.isResolved) {
            _.isEnded = true;
            _.waitSamples = Infinity;
            _.deferred.rejectWith(this);
            this.start = this.stop = fn.nop;
        }
    };
    Object.defineProperty(onstop, "unremovable", {
        value:true, writable:false
    });
    var onended = function() {
        var _ = this._;
        _.isEnded = true;
        if (_.deferred && !this.isResolved) {
            var stop = this.stop;
            this.start = this.stop = fn.nop;
            _.emit("ended");
            _.deferred.resolveWith(this);
            stop.call(this);
        } else {
            this.stop();
            _.emit("ended");
        }
    };
    
    var $ = IntervalNode.prototype;
    
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
    
    $.process = function(tickID) {
        var cell = this.cell;
        
        var _ = this._;
        
        if (_.isEnded) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }
            _.interval.process(tickID);
            
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
                fn.nextTick(onended.bind(this));
            }
        }
        return cell;
    };
    
    fn.register("interval", IntervalNode);
    
})(timbre);
