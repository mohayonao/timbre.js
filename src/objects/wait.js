(function(timbre) {
    "use strict";

    function Wait(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.timer(this);
        timbre.fn.fixKR(this);
        timbre.fn.deferred(this);
        
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.waitSamples = 0;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Wait, timbre.Object);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 1000;
        }
    };
    
    var $ = Wait.prototype;

    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.time = value;
                    this._.waitSamples = (timbre.samplerate * (value * 0.001))|0;
                }
            },
            get: function() {
                return this._.time;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.waitSamples > 0) {
                _.waitSamples -= cell.length;
            }
            
            if (_.waitSamples <= 0) {
                var inputs = this.inputs;
                for (var i = 0, imax = inputs.length; i < imax; ++i) {
                    inputs[i].bang();
                }
                timbre.fn.nextTick(ondone.bind(this));
            }
            
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    var ondone = function() {
        if (!this.isResolved) {
            this._.waitSamples = Infinity;
            this._.emit("done");
            this._.deferred.resolve();
            this.pause();
        }
        this.start = this.pause = timbre.fn.nop;
    };
    
    timbre.fn.register("wait", Wait);
    timbre.fn.alias("timeout", "wait");
})(timbre);
