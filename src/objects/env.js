(function(timbre) {
    "use strict";
    
    var ZERO = 1e-6;
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function Envelope(_args) {
        timbre.Object.call(this, _args);
        
        this._.value   = ZERO;
        this._.index   = 0;
        this._.samples = 0;
        this._.curve   = CurveTypeNone;
        this._.goalValue = ZERO;
        this._.variation = 0;
        this._.status = StatusWait;
        this._.releaseNode = null;
        this._.loopNode    = null;
        this._.defaultCurve = CurveTypeLin;
        this._.curveName = "linear";
        this._.initValue = ZERO;
        this._.table = [];
        
        this._.kr = true;
        
        this._.plotFlush = true;
    }
    fn.extend(Envelope);
    
    var CurveTypeNone = 0;
    var CurveTypeLin  = 1;
    var CurveTypeExp  = 2;
    var StatusWait    = 0;
    var StatusGate    = 1;
    var StatusSustain = 2;
    var StatusRelease = 3;
    var StatusEnd     = 4;
    
    var $ = Envelope.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.originaltable = value;
                    buildTable.call(this, value);
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.originaltable;
            }
        },
        curve: {
            set: function(value) {
                switch (value) {
                case "linear": case "lin":
                    this._.defaultCurve = CurveTypeLin;
                    this._.curveName = value;
                    break;
                case "exponential": case "exp":
                    this._.defaultCurve = CurveTypeExp;
                    this._.curveName = value;
                    break;
                }
            },
            get: function() {
                return this._.curveName;
            }
        },
        index: {
            get: function() {
                return this._.index;
            }
        },
        releaseNode: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.releaseNode = value - 1;
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.releaseNode + 1;
            }
        },
        loopNode: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.loopNode = value - 1;
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.loopNode + 1;
            }
        }
    });
    
    var buildTable = function(list) {
        var _ = this._;
        var i, imax;
        if (list.length === 0) {
            _.initValue = ZERO;
            _.table     = [];
            return;
        }
        
        _.initValue = list[0] || ZERO;
        _.table     = [];
        
        var table = _.table;
        var value, time, curve;
        for (i = 1, imax = list.length; i < imax; ++i) {
            value = list[i][0] || ZERO;
            time  = list[i][1];
            curve = list[i][2];
            
            if (typeof time !== "number") {
                if (typeof time === "string") {
                    time = timevalue(time);
                } else {
                    time = 10;
                }
            }
            if (time < 10) {
                time = 10;
            }

            switch (curve) {
            case "linear": case "lin":
                curve = CurveTypeLin;
                break;
            case "exponential": case "exp":
                curve = CurveTypeExp;
                break;
            default:
                curve = null;
                break;
            }
            
            table.push([value, time, curve]);
        }
    };
    
    $.reset = function() {
        var _ = this._;
        
        _.value = _.goalValue = _.initValue;
        _.index = 0;
        
        _.samples = 0;
        _.curve   = CurveTypeNone;
        _.variation = 0;
        _.status = StatusWait;
        return this;
    };
    
    $.release = function() {
        var _ = this._;
        _.samples = 0;
        _.status = StatusRelease;
        _.emit("released");
        return this;
    };
    
    $.bang = function() {
        var _ = this._;
        this.reset();
        _.status = StatusGate;
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
            
            var items, samples;
            var time, value;
            var emit = false;
            
            switch (_.status) {
            case StatusWait:
            case StatusEnd:
                break;
            case StatusGate:
            case StatusRelease:
                while (_.samples <= 0) {
                    if (_.index >= _.table.length) {
                        if (_.status === StatusGate && _.loopNode !== null) {
                            _.index = _.loopNode;
                            continue;
                        }
                        _.samples = Infinity;
                        _.curve   = CurveTypeNone;
                        emit = "ended";
                        continue;
                    } else if (_.status === StatusGate && _.index === _.releaseNode) {
                        if (_.loopNode !== null && _.loopNode < _.releaseNode) {
                            _.index = _.loopNode;
                            continue;
                        }
                        _.status  = StatusSustain;
                        _.samples = Infinity;
                        _.curve   = CurveTypeNone;
                        emit = "sustained";
                        continue;
                    }
                    items = _.table[_.index++];
                    
                    _.goalValue = items[0];
                    if (items[2] === null) {
                        _.curve = _.defaultCurve;
                    } else {
                        _.curve = items[2];
                    }
                    time = items[1];
                    
                    samples = time * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        if (_.curve === CurveTypeExp) {
                            _.variation = Math.pow(
                                _.goalValue / _.value, 1 / (samples / cell.length)
                            );
                        } else {
                            _.curve = CurveTypeLin;
                            _.variation = (_.goalValue - _.value) / (samples / cell.length);
                        }
                        _.samples += samples;
                    }
                }
                break;
            }
            
            value = _.value;
            for (i = imax; i--; ) {
                cell[i] = (cell[i] * value) * mul + add;
            }
            
            switch (_.curve) {
            case CurveTypeLin:
                _.value += _.variation;
                break;
            case CurveTypeExp:
                _.value *= _.variation;
                break;
            }
            _.value = _.value || ZERO;
            _.samples -= cell.length;
            
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
            var plotter = new EnvPlotter(this);
            var data = plotter.plot(256);
            
            var totalDuration    = plotter.totalDuration;
            var loopBeginTime    = plotter.loopBeginTime;
            var releaseBeginTime = plotter.releaseBeginTime;
            
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
            for (var i = 0, imax = data.length; i < imax; ++i) {
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
    fn.register("env", Envelope);
    
    
    function EnvPlotter(env) {
        this.initValue = env._.initValue;
        this.table     = env._.table;
        this.tableIndex   = 0;
        this.loopNode     = env._.loopNode;
        this.releaseNode  = env._.releaseNode;
        this.defaultCurve = env._.defaultCurve;
        this.sustainTime = 1000;
        this.value = this.nextValue = 0;
        this.index = this.nextIndex = 0;
        this.duration = 0;
        this.loopBeginTime    = Infinity;
        this.releaseBeginTime = Infinity;
        this.status = 0; // 0:gate, 1:release
        this.isEndlessLoop = false;
        
        var totalDuration = 0;
        for (var i = 0, imax = this.table.length; i < imax; ++i) {
            if (this.loopNode === i) {
                this.loopBeginTime = totalDuration;
            }
            if (this.releaseNode === i) {
                totalDuration += this.sustainTime;
                this.releaseBeginTime = totalDuration;
            }
            
            var items = this.table[i];
            if (Array.isArray(items)) {
                totalDuration += items[1];
            }
        }
        if (this.loopBeginTime !== Infinity && this.releaseBeginTime === Infinity) {
            totalDuration += this.sustainTime;
            this.isEndlessLoop = true;
        }
        
        this.totalDuration = totalDuration;
    }
    
    EnvPlotter.prototype.plot = function(size) {
        this.data = new Float32Array(size);
        this.dt = this.data.length / this.totalDuration;
        
        this.value = this.initValue;
        
        while (this.duration < this.totalDuration) {
            if (this.status === 0 && this.duration < this.releaseBeginTime) {
                if (this.tableIndex === this.releaseNode) {
                    if (this.loopNode) {
                        this.tableIndex = this.loopNode;
                    } else {
                        this.tableIndex -= 1;
                    }
                }
            }
            var items = this.table[this.tableIndex];
            if (!items) {
                break;
            }
            this.fillValues(items);
            this.tableIndex += 1;
            if (this.isEndlessLoop && this.tableIndex === this.table.length) {
                this.tableIndex = this.loopNode;
            }
        }
        return this.data;
    };
    
    EnvPlotter.prototype.fillValues = function(items) {
        var nextValue = items[0] || ZERO;
        var duration  = items[1] || 0;
        var nextIndex = this.index + (duration * this.dt)|0;
        var curve = (items[2] === null) ? this.defaultCurve : items[2];
        
        var durationIncr;
        if (this.index === nextIndex) {
            durationIncr = 1 / this.dt;
            nextIndex += 1;
        } else {
            durationIncr = duration / (nextIndex - this.index);
        }
        
        var dx;
        if (curve === CurveTypeLin) {
            dx = (nextValue - this.value) / (nextIndex - this.index);
        } else if (curve === CurveTypeExp) {
            dx = Math.pow(
                nextValue / this.value, 1 / (nextIndex - this.index)
            );
        }
        
        var lastIndex = Math.min(nextIndex, this.data.length);
        while (this.index < lastIndex) {
            this.data[this.index] = this.value;
            if (curve === CurveTypeLin) {
                this.value += dx;
            } else if (curve === CurveTypeExp) {
                this.value *= dx;
            }
            this.duration += durationIncr;
            this.index += 1;
            if (this.status === 0 && this.releaseBeginTime <= this.duration) {
                this.tableIndex = this.releaseNode - 1;
                this.status = 1; // release
                break;
            }
        }

        nextIndex = (this.data.length * (this.duration / this.totalDuration))|0;
        while (this.index < nextIndex) {
            this.data[this.index++] = this.value;
        }
    };
    
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
    
})(timbre);
