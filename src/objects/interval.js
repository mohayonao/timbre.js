(function(timbre) {
    "use strict";

    function Interval(_args) {
        var pending =  (_args[0] && _args[0].pending);
        timbre.TimerObject.call(this, _args);
        
        this._.interval = 1000;
        this._.delay    =    0;
        this._.count    =    0;
        this._.limit    = Infinity;
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.delaySamples = 0;
        this._.countSamples = 0;
        
        this.on("start", function() {
            this._.currentTime  = timbre.currentTime;
        });
        
        if (!pending && this.inputs.length) {
            this.once("init", function() {
                this.start();
            });
        }
        
        this.on("ar", function() { this._.ar = false; });
    }
    timbre.fn.extend(Interval, timbre.TimerObject);
    
    var $ = Interval.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.interval = value;
                }
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
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * _.interval * 0.001)|0;
                    var inputs = this.inputs;
                    for (var i = 0, imax = inputs.length; i < imax; ++i) {
                        inputs[i].bang();
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
    
    timbre.fn.register("interval", Interval);
    
    timbre.fn.register("timeout", function(_args) {
        return new Interval(_args).once("init", function() {
            if (this.delay === 0) {
                this.delay = this.interval;
            }
            this.limit = 1;
        });
    });
})(timbre);
