(function(T) {
    "use strict";

    function Envelope(samplerate) {
        this.samplerate = samplerate || 44100;
        this.value  = ZERO;
        this.status = StatusWait;
        this.curve  = "linear";
        this.step   = 1;
        this.releaseNode = null;
        this.loopNode    = null;
        this.emit = null;

        this._envValue = new EnvelopeValue(samplerate);

        this._table  = [];
        this._initValue  = ZERO;
        this._curveValue = 0;
        this._defaultCurveType = CurveTypeLin;
        this._index   = 0;
        this._counter = 0;
    }

    var ZERO           = Envelope.ZERO = 1e-6;
    var CurveTypeSet   = Envelope.CurveTypeSet   = 0;
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
        set:CurveTypeSet,
        lin:CurveTypeLin, linear     :CurveTypeLin,
        exp:CurveTypeExp, exponential:CurveTypeExp,
        sin:CurveTypeSin, sine       :CurveTypeSin,
        wel:CurveTypeWel, welch      :CurveTypeWel,
        sqr:CurveTypeSqr, squared    :CurveTypeSqr,
        cub:CurveTypeCub, cubed      :CurveTypeCub
    };
    Envelope.CurveTypeDict = CurveTypeDict;

    var $ = Envelope.prototype;

    $.clone = function() {
        var new_instance = new Envelope(this.samplerate);
        new_instance._table = this._table;
        new_instance._initValue = this._initValue;
        new_instance.setCurve(this.curve);
        if (this.releaseNode !== null) {
            new_instance.setReleaseNode(this.releaseNode + 1);
        }
        if (this.loopNode !== null) {
            new_instance.setLoopNode(this.loopNode + 1);
        }
        new_instance.setStep(this.step);
        new_instance.reset();
        return new_instance;
    };
    $.setTable = function(value) {
        this._initValue = value[0];
        this._table = value.slice(1);
        this.value = this._envValue.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
        this.status = StatusWait;
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
    $.setStep = function(step) {
        this.step = this._envValue.step = step;
    };
    $.reset = function() {
        this.value = this._envValue.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
        this.status = StatusWait;
    };
    $.release = function() {
        if (this.releaseNode !== null && this._index <= this.releaseNode) {
            this._counter = 0;
            this._index = this.releaseNode;
            this.status = StatusRelease;
        }
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
                if (totalDuration < sustainTime) {
                    totalDuration += sustainTime;
                } else {
                    totalDuration  = sustainTime;
                }
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

    $.calcStatus = function() {
        var status  = this.status;
        var table   = this._table;
        var index   = this._index;
        var counter = this._counter;

        var curveValue = this._curveValue;
        var defaultCurveType = this._defaultCurveType;
        var loopNode    = this.loopNode;
        var releaseNode = this.releaseNode;
        var envValue = this._envValue;
        var items, endValue, time, curveType, emit = null;

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
                    curveType = CurveTypeSet;
                    emit      = "ended";
                    continue;
                } else if (status === StatusGate && index === releaseNode) {
                    if (loopNode !== null && loopNode < releaseNode) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusSustain;
                    counter   = Infinity;
                    curveType = CurveTypeSet;
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

                counter = envValue.setNext(endValue, time, curveType, curveValue);
            }
            break;
        }

        this.status = status;
        this.emit   = emit;
        this._index = index;
        this._counter = counter;

        return status;
    };

    $.next = function() {
        if (this.calcStatus() & 1) {
            this.value  = this._envValue.next() || ZERO;
        }
        this._counter -= 1;
        return this.value;
    };

    $.process = function(cell) {
        var envValue = this._envValue;
        var i, imax = cell.length;

        if (this.calcStatus() & 1) {
            for (i = 0; i < imax; ++i) {
                cell[i] = envValue.next() || ZERO;
            }
        } else {
            var value = this.value || ZERO;
            for (i = 0; i < imax; ++i) {
                cell[i] = value;
            }
        }
        this.value = cell[imax-1];

        this._counter -= cell.length;
    };


    function EnvelopeValue(samplerate) {
        this.samplerate = samplerate;
        this.value = ZERO;
        this.step  = 1;

        this._curveType  = CurveTypeLin;
        this._curveValue = 0;

        this._grow = 0;

        this._a2 = 0;
        this._b1 = 0;
        this._y1 = 0;
        this._y2 = 0;
    }
    EnvelopeValue.prototype.setNext = function(endValue, time, curveType, curveValue) {
        var n = this.step;
        var value = this.value;
        var grow, w, a1, a2, b1, y1, y2;

        var counter = ((time * 0.001 * this.samplerate) / n)|0;
        if (counter < 1) {
            counter   = 1;
            curveType = CurveTypeSet;
        }

        switch (curveType) {
        case CurveTypeSet:
            this.value = endValue;
            break;
        case CurveTypeLin:
            grow = (endValue - value) / counter;
            break;
        case CurveTypeExp:
            if (value !== 0) {
                grow = Math.pow(
                    endValue / value, 1 / counter
                );
            } else {
                grow = 0;
            }
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

        this.next = NextFunctions[curveType];
        this._grow = grow;
        this._a2 = a2;
        this._b1 = b1;
        this._y1 = y1;
        this._y2 = y2;

        return counter;
    };

    var NextFunctions = [];
    NextFunctions[CurveTypeSet] = function() {
        return this.value;
    };
    NextFunctions[CurveTypeLin] = function() {
        this.value += this._grow;
        return this.value;
    };
    NextFunctions[CurveTypeExp] = function() {
        this.value *= this._grow;
        return this.value;
    };
    NextFunctions[CurveTypeSin] = function() {
        var y0 = this._b1 * this._y1 - this._y2;
        this.value = this._a2 - y0;
        this._y2 = this._y1;
        this._y1 = y0;
        return this.value;
    };
    NextFunctions[CurveTypeWel] = function() {
        var y0 = this._b1 * this._y1 - this._y2;
        this.value = this._a2 + y0;
        this._y2 = this._y1;
        this._y1 = y0;
        return this.value;
    };
    NextFunctions[CurveTypeCurve] = function() {
        this._b1 *= this._grow;
        this.value = this._a2 - this._b1;
        return this.value;
    };
    NextFunctions[CurveTypeSqr] = function() {
        this._y1 += this._grow;
        this.value = this._y1 * this._y1;
        return this.value;
    };
    NextFunctions[CurveTypeCub] = function() {
        this._y1 += this._grow;
        this.value = this._y1 * this._y1 * this._y1;
        return this.value;
    };

    EnvelopeValue.prototype.next = NextFunctions[CurveTypeSet];

    T.modules.Envelope      = Envelope;
    T.modules.EnvelopeValue = EnvelopeValue;

})(timbre);
