(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var Envelope  = timbre.modules.Envelope;
    
    function EnvNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.env = new Envelope(timbre.samplerate);
        _.env.step = this.cell.length;
        _.kr = true;
        _.plotFlush = true;
    }
    fn.extend(EnvNode);
    
    var $ = EnvNode.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.env.setTable(value);
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.env.table;
            }
        },
        curve: {
            set: function(value) {
                this._.env.setCurve(value);
            },
            get: function() {
                return this._.env.curve;
            }
        },
        releaseNode: {
            set: function(value) {
                this._.env.setReleaseNode(value);
                this._.plotFlush = true;
            },
            get: function() {
                return this._.env.releaseNode + 1;
            }
        },
        loopNode: {
            set: function(value) {
                this._.env.setLoopNode(value);
                this._.plotFlush = true;
            },
            get: function() {
                return this._.env.loopNode + 1;
            }
        }
    });

    $.clone = function() {
        var instance = new EnvNode([]);
        instance._.env = this._.env.clone();
        return instance;
    };
    
    $.reset = function() {
        this._.env.reset();
        return this;
    };
    
    $.release = function() {
        var _ = this._;
        _.env.release();
        _.emit("released");
        return this;
    };
    
    $.bang = function() {
        var _ = this._;
        _.env.reset();
        _.env.status = Envelope.StatusGate;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = cell.length;
            var mul = _.mul, add = _.add;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            var value = _.env.next();
            
            for (i = imax; i--; ) {
                cell[i] = (cell[i] * value) * mul + add;
            }
            
            var emit = _.env.emit;
            if (emit) {
                if (emit === "ended") {
                    fn.nextTick(onended.bind(this));
                } else {
                    this._.emit(emit, _.value);
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var env = this._.env.clone();
            var info = env.getInfo(1000);
            
            var totalDuration    = info.totalDuration;
            var loopBeginTime    = info.loopBeginTime;
            var releaseBeginTime = info.releaseBeginTime;
            var data = new Float32Array(256);
            var duration = 0;
            var durationIncr = totalDuration / data.length;
            var isReleased   = false;
            var samples = (totalDuration * 0.001 * timbre.samplerate)|0;
            var i, imax;
            
            samples /= data.length;
            env.step = samples;
            env.status = Envelope.StatusGate;
            for (i = 0, imax = data.length; i < imax; ++i) {
                data[i] = env.next();
                duration += durationIncr;
                if (!isReleased && duration >= releaseBeginTime) {
                    env.release();
                    isReleased = true;
                }
            }
            this._.plotData = data;
            
            this._.plotBefore = function(context, x, y, width, height) {
                var x1, w;
                if (loopBeginTime !== Infinity && releaseBeginTime !== Infinity) {
                    x1 = x + (width * (loopBeginTime    / totalDuration));
                    w  = x + (width * (releaseBeginTime / totalDuration));
                    w  = w - x1;
                    context.fillStyle = "rgba(224, 224, 224, 0.8)";
                    context.fillRect(x1, 0, w, height);
                }
                if (releaseBeginTime !== Infinity) {
                    x1 = x + (width * (releaseBeginTime / totalDuration));
                    w  = width - x1;
                    context.fillStyle = "rgba(212, 212, 212, 0.8)";
                    context.fillRect(x1, 0, w, height);
                }
            };
            
            // y-range
            var minValue = Infinity, maxValue = -Infinity;
            for (i = 0; i < imax; ++i) {
                if (data[i] < minValue) {
                    minValue = data[i];
                } else if (data[i] > maxValue) {
                    maxValue = data[i];
                }
            }
            if (maxValue < 1) {
                maxValue = 1;
            }
            this._.plotRange = [minValue, maxValue];
            
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    fn.register("env", EnvNode);
    
    
    var isDictionary = function(x) {
        return (typeof x === "object" && x.constructor === Object);
    };
    
    function envValue(opts, min, def, name1, name2, func) {
        var x = def;
        if (typeof opts[name1] === "number") {
            x = opts[name1];
        } else if (typeof opts[name2] === "number") {
            x = opts[name2];
        } else if (func) {
            if (typeof opts[name1] === "string") {
                x = func(opts[name1]);
            } else if (typeof opts[name2] === "string") {
                x = func(opts[name2]);
            }
        }
        if (x < min) {
            x = min;
        }
        return x;
    }
    
    var ZERO = Envelope.ZERO;
    
    fn.register("perc", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "decayTime" , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"     );
        
        opts.table = [ZERO, [lv, a], [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("adsr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "decayTime"   , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [lv, a], [s, d], [ZERO, r]];
        opts.releaseNode = 3;
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("asr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime" , timevalue);
        
        opts.table = [ZERO, [s, a], [ZERO, r]];
        opts.releaseNode = 2;
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("dadsr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dl = envValue(opts,   10,  100, "dl", "delayTime"   , timevalue);
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  );
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "relaseTime"  , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [ZERO, dl], [lv, a], [s, d], [ZERO, r]];
        opts.releaseNode = 4;
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("linen", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime" , timevalue);
        var s  = envValue(opts,   10, 1000, "s" , "sustainTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime", timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"      );
        
        opts.table = [ZERO, [lv, a], [lv, s], [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("env.tri", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dur = envValue(opts,   20, 1000, "dur", "duration", timevalue);
        var lv  = envValue(opts, ZERO,    1, "lv" , "level"   );
        
        dur *= 0.5;
        opts.table = [ZERO, [lv, dur], [ZERO, dur]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    fn.register("env.cutoff", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var r  = envValue(opts,   10, 100, "r" , "relaseTime", timevalue);
        var lv = envValue(opts, ZERO,   1, "lv", "level"    );
        
        opts.table = [lv, [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
})();
