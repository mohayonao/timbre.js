(function(T) {
    "use strict";
    
    var fn = T.fn;
    var timevalue = T.timevalue;
    
    function TimeoutNode(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.currentTime = 0;
        _.currentTimeIncr = T.cellsize * 1000 / T.samplerate;
        _.samplesMax = 0;
        _.samples    = 0;
        _.isEnded = true;
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
        this._.isEnded = false;
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
                    _.timeout = value;
                    _.samplesMax = (T.samplerate * (value * 0.001))|0;
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
        _.samples = _.samplesMax;
        _.currentTime = 0;
        _.isEnded = false;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;

        if (_.isEnded) {
            return this;
        }
        
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
            _.currentTime += _.currentTimeIncr;
        }
        return this;
    };
    
    fn.register("timeout", TimeoutNode);
    
})(timbre);
