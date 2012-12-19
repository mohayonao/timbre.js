(function(timbre) {
    "use strict";

    function Timer(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.timer(this);
        timbre.fn.fixKR(this);
        
        this._.count    =    0;
        this._.limit    = Infinity;
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.delaySamples = 0;
        this._.countSamples = 0;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    timbre.fn.extend(Timer, timbre.Object);
    
    var oninit = function() {
        if (!this._.interval) {
            this.interval = 1000;
        }
        if (this._.delay === undefined) {
            this.delay = this.interval;
        }
    };
    
    var onstart = function() {
        this._.currentTime  = timbre.currentTime;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    
    var $ = Timer.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                this._.interval = timbre(value);
            },
            get: function() {
                return this._.interval;
            }
        },
        delay: {
            set: function(value) {
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
        limit: {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.limit = value;
                }
            },
            get: function() {
                return this._.limit;
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
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = 0;
        _.currentTime  = timbre.currentTime;
        this.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        
        var _ = this._;
        
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
                    var count = _.count;
                    var x = count * _.mul + _.add;
                    for (var j = cell.length; j--; ) {
                        cell[j] = x;
                    }
                    for (var i = 0, imax = inputs.length; i < imax; ++i) {
                        inputs[i].bang(count);
                    }
                    ++_.count;
                    if (_.count >= _.limit) {
                        var self = this;
                        timbre.nextTick(function() {
                            self.emit("limit");
                            self.pause();
                        });
                    }
                }
            }
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    timbre.fn.register("timer", Timer);
    
    timbre.fn.alias("interval", "timer");
    
    timbre.fn.register("timeout", function(_args) {
        return new Timer(_args).once("init", function() {
            if (this.delay === 0) {
                this.delay = this.interval;
            }
            this.limit = 1;
        });
    });
})(timbre);
