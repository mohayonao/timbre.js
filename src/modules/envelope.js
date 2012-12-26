(function(timbre) {
    "use strict";

    var timevalue = timbre.utils.timevalue;
    
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
    
    var ZERO           = Envelope.ZERO = 1e-6;
    var CurveTypeStep  = Envelope.CurveTypeStep  = 0;
    var CurveTypeLin   = Envelope.CurveTypeLin   = 1;
    var CurveTypeExp   = Envelope.CurveTypeExp   = 2;
    var CurveTypeSin   = Envelope.CurveTypeSin   = 3;
    var CurveTypeWel   = Envelope.CurveTypeWel   = 4;
    var CurveTypeCurve = Envelope.CurveTypeCurve = 5;
    var CurveTypeSqr   = Envelope.CurveTypeSqr   = 6;
    var CurveTypeCub   = Envelope.CurveTypeCub   = 7;
    
    var StatusWait    = Envelope.StatusWait    = 0;
    var StatusGate    = Envelope.StatusGate    = 1;
    var StatusSustain = Envelope.StatusSustain = 2;
    var StatusRelease = Envelope.StatusRelease = 3;
    var StatusEnd     = Envelope.StatusEnd     = 4;

    var CurveTypeDict = {
        lin:CurveTypeLin, linear     :CurveTypeLin,
        exp:CurveTypeExp, exponential:CurveTypeExp,
        sin:CurveTypeSin, sine       :CurveTypeSin,
        wel:CurveTypeWel, welch      :CurveTypeWel,
        sqr:CurveTypeSqr, squared    :CurveTypeSqr,
        cub:CurveTypeCub, cubed      :CurveTypeCub
    };
    
    var $ = Envelope.prototype;
    
    $.clone = function() {
        var new_instance = new Envelope(this.samplerate);
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
    $.setTable = function(value) {
        if (Array.isArray(value)) {
            this.originaltable = value;
            this._buildTable(value);
            this.level = this.initLevel;
        }
    };
    $.setCurve = function(value) {
        if (typeof value === "number")  {
            this.defaultCurveType = CurveTypeCurve;
            this.curveValue = value;
            this.curveName  = value;
        } else {
            this.defaultCurveType = CurveTypeDict[value] || null;
            this.curveName = value;
        }
    };
    $.setReleaseNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.releaseNode = value - 1;
        }
    };
    $.setLoopNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.loopNode = value - 1;
        }
    };
    $.reset = function() {
        this.level = this.endLevel = this.initLevel;
        this.index   = 0;
        this.counter = this.counterMax = 0;
        this.curveType  = CurveTypeStep;
        this.grow   = 0;
        this.status = StatusWait;
    };
    $.release = function() {
        this.counter = this.counterMax = 0;
        this.status = StatusRelease;
    };
    $.calcTotalDuration = function(sustainTime) {
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
    $.next = function() {
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
    $._buildTable = function(list) {
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
    
    timbre.modules.Envelope = Envelope;
    
})(timbre);
