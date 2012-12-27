(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function TimeoutNode(_args) {
        var isonce = false;
        if (typeof _args[0] === "object" && _args[0].constructor === Object) {
            if (_args[0].once) {
                isonce = true;
            }
        }
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        _.samplesMax = 0;
        _.samples    = 0;
        _.isEnded = true;
        _.isonce = isonce;
        
        this.once("init", oninit);
        this.on("start", onstart);
        
        if (_.isonce) {
            fn.deferred(this);
            this.on("stop", onstop);
        }
    }
    
    fn.extend(TimeoutNode);
    
    var oninit = function() {
        if (!this._.timeout) {
            this.timeout = 1000;
        }
    };
    
    var onstart = function() {
        this._.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    var onstop = function() {
        var _ = this._;
        if (_.isonce && !this.isResolved) {
            _.samplesMax = Infinity;
            _.isEnded = true;
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
        if (_.isonce && !this.isResolved) {
            _.samplesMax = Infinity;
            _.emit("ended");
            _.deferred.resolveWith(this);
            var stop = this.stop;
            this.start = this.stop = fn.nop;
            stop.call(this);
        } else {
            _.emit("ended");
        }
    };
    
    var $ = TimeoutNode.prototype;
    
    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    _.timeout = value;
                    _.samplesMax = (timbre.samplerate * (value * 0.001))|0;
                    _.samples = _.samplesMax;
                    _.isEnded = false;
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
        if (!_.isonce ) {
            _.samples = _.samplesMax;
            _.currentTime = 0;
            _.isEnded = false;
        }
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
            
            if (_.samples > 0) {
                _.samples -= cell.length;
            }
            
            if (_.samples <= 0) {
                var inputs = this.inputs;
                for (var i = 0, imax = inputs.length; i < imax; ++i) {
                    inputs[i].bang();
                }
                fn.nextTick(onended.bind(this));
            }
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    fn.register("timeout", TimeoutNode);
    
})(timbre);
