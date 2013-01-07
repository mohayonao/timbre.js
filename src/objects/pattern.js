(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;

    function PatternNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        fn.timer(this);
        
        var _ = this._;
        _.iter = null;
        _.samples  = 0;
        _.isEnded  = false;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    fn.extend(PatternNode);
    
    var oninit = function() {
        if (!this._.interval) {
            this.interval = 500;
        }
    };
    
    var onstart = function() {
        var _ = this._;
        if (_.iter && _.iter.reset) {
            _.iter.reset();
        }
        _.samples = 0;
        _.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    var onended = function() {
        this._.isEnded = true;
        this._.emit("ended");
    };
    
    var $ = PatternNode.prototype;
    
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
        }
    });
    
    $.next = function() {
        var _ = this._;
        if (_.iter && _.iter.next) {
            return _.iter.next();
        }
        return null;
    };

    // TODO: ??
    $.bang = function() {
        var _ = this._;
        _.samples = 0;
        _.isEnded = false;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var isEnded = false;
            if (!_.isEnded) {
                _.interval.process(tickID);
                
                _.samples -= cell.length;
                if (_.samples <= 0) {
                    _.samples += (timbre.samplerate * _.interval.valueOf() * 0.001)|0;
                    var inputs  = this.inputs;
                    
                    var value = null;
                    if (_.iter && _.iter.next) {
                        value = _.iter.next();
                    }
                    if (value === null) {
                        value = 0;
                        isEnded = true;
                        fn.nextTick(onended.bind(this));
                    }
                    
                    var x = value * _.mul + _.add;
                    for (var j = cell.length; j--; ) {
                        cell[j] = x;
                    }
                    if (!isEnded) {
                        for (var i = 0, imax = inputs.length; i < imax; ++i) {
                            inputs[i].bang(value);
                        }
                    }
                }
            }
        }
        
        return cell;
    };
    
    
    
    
    var isDictionary = function(object) {
        return (typeof object === "object" && object.constructor === Object);
    };
    
    var iterator = timbre.modules.iterator;
    
    fn.register("p.seq", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            list:[], length:1, offset:0
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.ListSequence.create(opts);
        return p;
    });
    
    fn.register("p.shuf", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            list:[], length:1
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.ListShuffle.create(opts);
        return p;
    });
    
    fn.register("p.choose", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            list:[], length:1
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.ListChoose.create(opts);
        return p;
    });
    
    fn.register("p.arith", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            start:0, grow:1, length:Infinity
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.Arithmetic.create(opts);
        return p;
    });
    
    fn.register("p.geom", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            start:0, grow:1, length:Infinity
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.Geometric.create(opts);
        return p;
    });
    
    fn.register("p.drunk", function(_args) {
        var opts = isDictionary(_args[0]) ? _args[0] : {
            start:0, step:1, length:Infinity
        };
        var p = new PatternNode(_args);
        p._.iter = new iterator.Drunk.create(opts);
        return p;
    });
    
})();
