(function() {
    "use strict";
    
    var timevalue = timbre.timevalue;
    
    function Envelope(samplerate) {
        this.samplerate = samplerate || 44100;
        this.table  = [];
        this.value  = ZERO;
        this.status = StatusWait;
        this.curve  = "linear";
        this.step   = 1;
        this.releaseNode = null;
        this.loopNode    = null;
        this.emit = null;
        
        this._endValue   = ZERO;
        this._initValue  = ZERO;
        this._curveType  = CurveTypeLin;
        this._curveValue = 0;
        this._defaultCurveType = CurveTypeLin;
        this._table      = [];
        this._index      = 0;
        this._counter    = 0;
        this._grow   = 0;
        
        this._a2 = 0;
        this._b1 = 0;
        this._y1 = 0;
        this._y2 = 0;
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
        new_instance.setTable(this.table);
        new_instance.setCurve(this.curve);
        if (this.releaseNode !== null) {
            new_instance.setReleaseNode(this.releaseNode + 1);
        }
        if (this.loopNode !== null) {
            new_instance.setLoopNode(this.loopNode + 1);
        }
        new_instance.step = this.step;
        return new_instance;
    };
    $.setTable = function(value) {
        if (Array.isArray(value)) {
            this.table = value;
            this._buildTable(value);
            this.value = this._initValue;
        }
    };
    $.setCurve = function(value) {
        if (typeof value === "number")  {
            this._defaultCurveType = CurveTypeCurve;
            this._curveValue = value;
            this.curve = value;
        } else {
            this._defaultCurveType = CurveTypeDict[value] || null;
            this.curve = value;
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
        this.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
        this._curveType  = CurveTypeStep;
        this._grow   = 0;
        this.status = StatusWait;
    };
    $.release = function() {
        this._counter = 0;
        this.status = StatusRelease;
    };
    $.getInfo = function(sustainTime) {
        var table = this._table;
        var i, imax;
        var totalDuration    = 0;
        var loopBeginTime    = Infinity;
        var releaseBeginTime = Infinity;
        var isEndlessLoop    = false;
        for (i = 0, imax = table.length; i < imax; ++i) {
            if (this.loopNode === i) {
                loopBeginTime = totalDuration;
            }
            if (this.releaseNode === i) {
                totalDuration += sustainTime;
                releaseBeginTime = totalDuration;
            }
            
            var items = table[i];
            if (Array.isArray(items)) {
                totalDuration += items[1];
            }
        }
        if (loopBeginTime !== Infinity && releaseBeginTime === Infinity) {
            totalDuration += sustainTime;
            isEndlessLoop = true;
        }
        
        return {
            totalDuration   : totalDuration,
            loopBeginTime   : loopBeginTime,
            releaseBeginTime: releaseBeginTime,
            isEndlessLoop   : isEndlessLoop
        };
    };
    $.next = function() {
        var n = this.step;
        var samplerate = this.samplerate;
        var status  = this.status;
        var index   = this._index;
        var table   = this._table;
        var endValue = this._endValue;
        var curveType   = this._curveType;
        var curveValue = this._curveValue;
        var defaultCurveType = this._defaultCurveType;
        var value   = this.value;
        var grow    = this._grow;
        var loopNode    = this.loopNode;
        var releaseNode = this.releaseNode;
        var counter = this._counter;
        var w, items, time;
        var a1;
        var a2 = this._a2;
        var b1 = this._b1;
        var y0;
        var y1 = this._y1;
        var y2 = this._y2;
        var emit = null;
        
        switch (status) {
        case StatusWait:
        case StatusEnd:
            break;
        case StatusGate:
        case StatusRelease:
            while (counter <= 0) {
                if (index >= table.length) {
                    if (status === StatusGate && loopNode !== null) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusEnd;
                    counter   = Infinity;
                    curveType = CurveTypeStep;
                    emit      = "ended";
                    continue;
                } else if (status === StatusGate && index === releaseNode) {
                    if (this.loopNode !== null && loopNode < releaseNode) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusSustain;
                    counter   = Infinity;
                    curveType = CurveTypeStep;
                    emit      = "sustained";
                    continue;
                }
                items = table[index++];
                
                endValue = items[0];
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
                
                counter = ((time * 0.001 * samplerate) / n)|0;
                if (counter < 1) {
                    counter = 1;
                }
                
                switch (curveType) {
                case CurveTypeStep:
                    value = endValue;
                    break;
                case CurveTypeLin:
                    grow = (endValue - value) / counter;
                    break;
                case CurveTypeExp:
                    grow = Math.pow(
                        endValue / value, 1 / counter
                    );
                    break;
                case CurveTypeSin:
                    w = Math.PI / counter;
                    a2 = (endValue + value) * 0.5;
                    b1 = 2 * Math.cos(w);
                    y1 = (endValue - value) * 0.5;
                    y2 = y1 * Math.sin(Math.PI * 0.5 - w);
                    value = a2 - y1;
                    break;
                case CurveTypeWel:
                    w = (Math.PI * 0.5) / counter;
                    b1 = 2 * Math.cos(w);
                    if (endValue >= value) {
                        a2 = value;
                        y1 = 0;
                        y2 = -Math.sin(w) * (endValue - value);
                    } else {
                        a2 = endValue;
                        y1 = value - endValue;
                        y2 = Math.cos(w) * (value - endValue);
                    }
                    value = a2 + y1;
                    break;
                case CurveTypeCurve:
                    a1 = (endValue - value) / (1.0 - Math.exp(curveValue));
                    a2 = value + a1;
                    b1 = a1;
                    grow = Math.exp(curveValue / counter);
                    break;
                case CurveTypeSqr:
                    y1 = Math.sqrt(value);
                    y2 = Math.sqrt(endValue);
                    grow = (y2 - y1) / counter;
                    break;
                case CurveTypeCub:
                    y1 = Math.pow(value   , 0.33333333);
                    y2 = Math.pow(endValue, 0.33333333);
                    grow = (y2 - y1) / counter;
                    break;
                }
            }
            break;
        }
        
        switch (curveType) {
        case CurveTypeStep:
            value = endValue;
            break;
        case CurveTypeLin:
            value += grow;
            break;
        case CurveTypeExp:
            value *= grow;
            break;
        case CurveTypeSin:
            y0 = b1 * y1 - y2;
            value = a2 - y0;
            y2  = y1;
            y1  = y0;
            break;
        case CurveTypeWel:
            y0 = b1 * y1 - y2;
            value = a2 + y0;
            y2  = y1;
            y1  = y0;
            break;
        case CurveTypeCurve:
            b1 *= grow;
            value = a2 - b1;
            break;
        case CurveTypeSqr:
            y1 += grow;
            value = y1 * y1;
            break;
        case CurveTypeCub:
            y1 += grow;
            value = y1 * y1 * y1;
            break;
        }
        this.value = value || ZERO;
        
        this.status = status;
        this.emit   = emit;
        
        this._index = index;
        this._grow  = grow;
        this._endValue  = endValue;
        this._curveType = curveType;
        this._counter   = counter - 1;
        this._a2 = a2;
        this._b1 = b1;
        this._y1 = y1;
        this._y2 = y2;
        
        return this.value;
    };
    $._buildTable = function(list) {
        if (list.length === 0) {
            this._initValue = ZERO;
            this._table     = [];
            return;
        }
        
        this._initValue = list[0] || ZERO;
        this._table     = [];
        
        var table = this._table;
        var value, time, curveType, curveValue;
        for (var i = 1, imax = list.length; i < imax; ++i) {
            value = list[i][0] || ZERO;
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
            table.push([value, time, curveType, curveValue]);
        }
    };
    
    timbre.modules.Envelope = Envelope;
    
})();
