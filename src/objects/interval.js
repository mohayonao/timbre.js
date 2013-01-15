(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function IntervalNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        this.attrs[ATTRS_I] = timbre(1000);
        
        var _ = this._;
        _.count = 0;
        _.delay   = 0;
        _.timeout = Infinity;
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        _.delaySamples = 0;
        _.countSamples = 0;
        _.isEnded = false;
        
        this.on("start", onstart);
    }
    fn.extend(IntervalNode);
    
    var onstart = function() {
        var _ = this._;
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    var onended = function() {
        this._.isEnded = true;
        this._.emit("ended");
    };
    
    var $ = IntervalNode.prototype;

    var ATTRS_I = fn.setAttrs($, ["interval", "i"], {
        conv: function(value) {
            if (typeof value === "string") {
                value = timevalue(value);
                if (value <= 0) {
                    return 0;
                }
            }
            return value;
        }
    });
    
    Object.defineProperties($, {
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
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.isEnded = false;
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
            
            var interval = this.attrs[ATTRS_I].process(tickID)[0];
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * interval * 0.001)|0;
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
    
})();
