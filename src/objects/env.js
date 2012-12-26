(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function Env(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.env = new Envelope(timbre.samplerate);
        _.env.step = this.cell.length;
        _.kr = true;
        _.plotFlush = true;
    }
    fn.extend(Env);
    
    var $ = Env.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.env.setTable(value);
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.env.originaltable;
            }
        },
        curve: {
            set: function(value) {
                this._.env.setCurve(value);
            },
            get: function() {
                return this._.env.curveName;
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
        _.env.status = StatusGate;
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
            _.env.emit = null;
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
            env.calcTotalDuration(1000);
            
            var totalDuration    = env.totalDuration;
            var loopBeginTime    = env.loopBeginTime;
            var releaseBeginTime = env.releaseBeginTime;
            var data = new Float32Array(256);
            var duration = 0;
            var durationIncr = totalDuration / data.length;
            var isReleased   = false;
            var samples = (totalDuration * 0.001 * timbre.samplerate)|0;
            var i, imax;
            
            samples /= data.length;
            env.step = samples;
            env.status = StatusGate;
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
    fn.register("env", Env);
    
    
    var ZERO = 1e-6;
    var CurveTypeStep  = 0;
    var CurveTypeLin   = 1;
    var CurveTypeExp   = 2;
    var CurveTypeSin   = 3;
    var CurveTypeWel   = 4;
    var CurveTypeCurve = 5;
    var CurveTypeSqr   = 6;
    var CurveTypeCub   = 7;
    
    var StatusWait    = 0;
    var StatusGate    = 1;
    var StatusSustain = 2;
    var StatusRelease = 3;
    var StatusEnd     = 4;

    var CurveTypeDict = {
        lin:CurveTypeLin, linear     :CurveTypeLin,
        exp:CurveTypeExp, exponential:CurveTypeExp,
        sin:CurveTypeSin, sine       :CurveTypeSin,
        wel:CurveTypeWel, welch      :CurveTypeWel,
        sqr:CurveTypeSqr, squared    :CurveTypeSqr,
        cub:CurveTypeCub, cubed      :CurveTypeCub
    };
    
    function Envelope(samplerate) {
        
        this.samplerate = samplerate || timbre.samplerate;
        this.table     = [];
        this.level     = ZERO;
        this.endLevel  = ZERO;
        this.initLevel = ZERO;
        this.status    = StatusWait;
        this.step      = 1;
        this.index     = 0;
        this.counter   = 0;
        this.counterMax = 0;
        this.defaultCurveType = CurveTypeLin;
        this.curveName  = "linear";
        this.curveType  = CurveTypeLin;
        this.curveValue = 0;
        this.grow   = 0;
        this.releaseNode = null;
        this.loopNode    = null;
        this.emit  = null;
        this.totalDuration = 0;
        this.loopBeginTime = Infinity;
        this.releaseBeginTime = Infinity;
        this.isEndlessLoop    = null;
        
        this.m_a2 = 0;
        this.m_b1 = 0;
        this.m_y1 = 0;
        this.m_y2 = 0;
    }
    Envelope.prototype.clone = function() {
        var new_instance = new Envelope(this.step);
        new_instance.setTable(this.originaltable);
        new_instance.setCurve(this.curveName);
        if (this.releaseNode !== null) {
            new_instance.setReleaseNode(this.releaseNode + 1);
        }
        if (this.loopNode !== null) {
            new_instance.setLoopNode(this.loopNode + 1);
        }
        return new_instance;
    };
    Envelope.prototype.setTable = function(value) {
        if (Array.isArray(value)) {
            this.originaltable = value;
            this._buildTable(value);
            this.level = this.initLevel;
        }
    };
    Envelope.prototype.setCurve = function(value) {
        if (typeof value === "number")  {
            this.defaultCurveType = CurveTypeCurve;
            this.curveValue = value;
            this.curveName  = value;
        } else {
            this.defaultCurveType = CurveTypeDict[value] || null;
            this.curveName = value;
        }
    };
    Envelope.prototype.setReleaseNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.releaseNode = value - 1;
        }
    };
    Envelope.prototype.setLoopNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.loopNode = value - 1;
        }
    };
    Envelope.prototype.reset = function() {
        this.level = this.endLevel = this.initLevel;
        this.index   = 0;
        this.counter = this.counterMax = 0;
        this.curveType  = CurveTypeStep;
        this.grow   = 0;
        this.status = StatusWait;
    };
    Envelope.prototype.release = function() {
        this.counter = this.counterMax = 0;
        this.status = StatusRelease;
    };
    Envelope.prototype.calcTotalDuration = function(sustainTime) {
        var table = this.table;
        var i, imax;
        var totalDuration = 0;
        for (i = 0, imax = table.length; i < imax; ++i) {
            if (this.loopNode === i) {
                this.loopBeginTime = totalDuration;
            }
            if (this.releaseNode === i) {
                totalDuration += sustainTime;
                this.releaseBeginTime = totalDuration;
            }
            
            var items = table[i];
            if (Array.isArray(items)) {
                totalDuration += items[1];
            }
        }
        if (this.loopBeginTime !== Infinity && this.releaseBeginTime === Infinity) {
            totalDuration += sustainTime;
            this.isEndlessLoop = true;
        }
        
        this.totalDuration = totalDuration;
        
        return this;
    };
    Envelope.prototype.next = function() {
        var n = this.step;
        var samplerate = this.samplerate;
        var status  = this.status;
        var index   = this.index;
        var table   = this.table;
        var endLevel = this.endLevel;
        var curveType   = this.curveType;
        var curveValue = this.curveValue;
        var defaultCurveType = this.defaultCurveType;
        var level   = this.level;
        var grow    = this.grow;
        var loopNode    = this.loopNode;
        var releaseNode = this.releaseNode;
        var counter = this.counter;
        var counterMax = this.counterMax;
        var _counter;
        var w, items, time;
        var a1, y0;
        var m_a2 = this.m_a2;
        var m_b1 = this.m_b1;
        var m_y1 = this.m_y1;
        var m_y2 = this.m_y2;
        var emit = null;
        
        switch (status) {
        case StatusWait:
        case StatusEnd:
            break;
        case StatusGate:
        case StatusRelease:
            while (counter >= counterMax) {
                if (index >= table.length) {
                    if (status === StatusGate && loopNode !== null) {
                        index = loopNode;
                        continue;
                    }
                    status     = StatusEnd;
                    counterMax = Infinity;
                    curveType   = CurveTypeStep;
                    emit    = "ended";
                    continue;
                } else if (status === StatusGate && index === releaseNode) {
                    if (this.loopNode !== null && loopNode < releaseNode) {
                        index = loopNode;
                        continue;
                    }
                    status     = StatusSustain;
                    counterMax = Infinity;
                    curveType   = CurveTypeStep;
                    emit    = "sustained";
                    continue;
                }
                items = table[index++];
                
                endLevel = items[0];
                if (items[2] === null) {
                    curveType = defaultCurveType;
                } else {
                    curveType = items[2];
                }
                if (curveType === CurveTypeCurve) {
                    curveValue = items[3];
                    if (Math.abs(curveValue) < 0.001) {
                        curveType = CurveTypeLin;
                    }
                }
                
                time = items[1];
                
                counterMax  = time * 0.001 * samplerate;
                if (counterMax < 1) {
                    counterMax = 1;
                }
                
                _counter = counterMax / n;
                switch (curveType) {
                case CurveTypeStep:
                    level = endLevel;
                    break;
                case CurveTypeLin:
                    grow = (endLevel - level) / _counter;
                    break;
                case CurveTypeExp:
                    grow = Math.pow(
                        endLevel / level, 1 / _counter
                    );
                    break;
                case CurveTypeSin:
                    w = Math.PI / _counter;
                    m_a2 = (endLevel + level) * 0.5;
                    m_b1 = 2 * Math.cos(w);
                    m_y1 = (endLevel - level) * 0.5;
                    m_y2 = m_y1 * Math.sin(Math.PI * 0.5 - w);
                    level = m_a2 - m_y1;
                    break;
                case CurveTypeWel:
                    w = (Math.PI * 0.5) / _counter;
                    m_b1 = 2 * Math.cos(w);
                    if (endLevel >= level) {
                        m_a2 = level;
                        m_y1 = 0;
                        m_y2 = -Math.sin(w) * (endLevel - level);
                    } else {
                        m_a2 = endLevel;
                        m_y1 = level - endLevel;
                        m_y2 = Math.cos(w) * (level - endLevel);
                    }
                    level = m_a2 + m_y1;
                    break;
                case CurveTypeCurve:
                    a1 = (endLevel - level) / (1.0 - Math.exp(curveValue));
                    m_a2 = level + a1;
                    m_b1 = a1;
                    grow = Math.exp(curveValue / _counter);
                    break;
                case CurveTypeSqr:
                    m_y1 = Math.sqrt(level);
                    m_y2 = Math.sqrt(endLevel);
                    grow = (m_y2 - m_y1) / _counter;
                    break;
                case CurveTypeCub:
                    m_y1 = Math.pow(level   , 0.33333333);
                    m_y2 = Math.pow(endLevel, 0.33333333);
                    grow = (m_y2 - m_y1) / _counter;
                    break;
                }
                counter = 0;
            }
            break;
        }
        
        switch (curveType) {
        case CurveTypeStep:
            level = endLevel;
            break;
        case CurveTypeLin:
            level += grow;
            break;
        case CurveTypeExp:
            level *= grow;
            break;
        case CurveTypeSin:
            y0 = m_b1 * m_y1 - m_y2;
            level = m_a2 - y0;
            m_y2  = m_y1;
            m_y1  = y0;
            break;
        case CurveTypeWel:
            y0 = m_b1 * m_y1 - m_y2;
            level = m_a2 + y0;
            m_y2  = m_y1;
            m_y1  = y0;
            break;
        case CurveTypeCurve:
            m_b1 *= grow;
            level = m_a2 - m_b1;
            break;
        case CurveTypeSqr:
            m_y1 += grow;
            level = m_y1 * m_y1;
            break;
        case CurveTypeCub:
            m_y1 += grow;
            level = m_y1 * m_y1 * m_y1;
            break;
        }
        this.level = level || ZERO;
        
        this.status  = status;
        this.index   = index;
        this.grow    = grow;
        this.endLevel = endLevel;
        this.curveType   = curveType;
        this.emit    = emit;
        
        this.counter    = counter + n;
        this.counterMax = counterMax;

        this.m_a2 = m_a2;
        this.m_b1 = m_b1;
        this.m_y1 = m_y1;
        this.m_y2 = m_y2;
        
        return this.level;
    };
    Envelope.prototype._buildTable = function(list) {
        if (list.length === 0) {
            this.initLevel = ZERO;
            this.table     = [];
            return;
        }
        
        this.initLevel = list[0] || ZERO;
        this.table     = [];
        
        var table = this.table;
        var level, time, curveType, curveValue;
        for (var i = 1, imax = list.length; i < imax; ++i) {
            level = list[i][0] || ZERO;
            time  = list[i][1];
            curveType = list[i][2];
            
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
            
            if (typeof curveType === "number") {
                curveValue = curveType;
                curveType  = CurveTypeCurve;
            } else {
                curveType  = CurveTypeDict[curveType] || null;
                curveValue = 0;
            }
            table.push([level, time, curveType, curveValue]);
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
