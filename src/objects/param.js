(function() {
    "use strict";

    function ParamEvent(type, value, time) {
        this.type  = type;
        this.value = value;
        this.time  = time;
    }
    ParamEvent.None                   = 0;
    ParamEvent.SetValue               = 1;
    ParamEvent.LinearRampToValue      = 2;
    ParamEvent.ExponentialRampToValue = 3;
    ParamEvent.SetValueCurve          = 4;
    
    function Param(_args) {
        timbre.Object.call(this, _args);
        
        this._.value = 0;
        this._.minvalue = -Infinity;
        this._.maxValue = +Infinity;
        
        this._.eventtype = ParamEvent.None;
        this._.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        
        this._.schedules = [];
        
        this._.ar = false;
        
        this.on("setAdd", changeTheValue);
        this.on("setMul", changeTheValue);
        this.on("ar", function() { this._.ar = false; });
    }
    timbre.fn.extend(Param, timbre.Object);
    
    var $ = Param.prototype;
    
    var changeTheValue = function() {
        var _ = this._;
        var x = _.value * _.mul + _.add;
        var cell = this.cell;
        for (var i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    value = (value < _.minvalue) ?
                        _.minvalue : (value > _.maxValue) ? _.maxValue : value;
                    _.value = isNaN(value) ? 0 : value;
                    _.eventtype = ParamEvent.None;
                    changeTheValue.call(this);
                }
            },
            get: function() {
                return this._.value;
            }
        },
        minValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.minValue = value;
                }
            },
            get: function() {
                return this._.minValue;
            }
        },
        maxValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.maxValue = value;
                }
            },
            get: function() {
                return this._.maxValue;
            }
        }
    });
    
    var insertEvent = function(object, type, value, time) {
        var s = object._.schedules;
        var e = new ParamEvent(type, value, time);
        s.push(e);
        s.sort(function(a, b) {
            return a.time - b.time;
        });
    };
    
    $.setValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            _.currentTime = timbre.currentTime;
            insertEvent(this, ParamEvent.SetValue, value, time);
        }
        return this;
    };
    
    $.linearRampToValueAtTime = function(value, time) {
        var _ = this._;
        _.currentTime = timbre.currentTime;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(this, ParamEvent.LinearRampToValue, value, time);
        }
        return this;
    };
    $.lin = $.linearRampToValueAtTime;
    
    $.exponentialRampToValueAtTime = function(value, time) {
        var _ = this._;
        _.currentTime = timbre.currentTime;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(this, ParamEvent.ExponentialRampToValue, value, time);
        }
        return this;
    };
    $.exp = $.exponentialRampToValueAtTime;
    
    $.cancelScheduledValues = function(time) {
        if (typeof time === "number") {
            var s = this._.schedules;
            for (var i = 0, imax = s.length; i < imax; ++i) {
                if (time <= s[i].time) {
                    s.splice(i);
                    if (i === 0) {
                        this._.eventtype = ParamEvent.None;
                    }
                    break;
                }
            }
        }
        return this;
    };
    $.cancel = $.cancelScheduledValues;
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var schedules = _.schedules;
            var e, samples;
            
            while (_.eventtype === ParamEvent.None &&
                   schedules.length > 0 && _.currentTime <= schedules[0].time) {
                
                e = schedules.shift();
                switch (e.type) {
                case ParamEvent.SetValue:
                    _.eventtype = ParamEvent.SetValue;
                    _.goalValue = e.value;
                    _.goalTime  = e.time;
                    break;
                case ParamEvent.LinearRampToValue:
                    samples = (e.time - _.currentTime) * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        _.eventtype = ParamEvent.LinearRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time;
                        _.variation = (e.value - _.value) / (samples / cell.length);
                    }
                    break;
                case ParamEvent.ExponentialRampToValue:
                    samples = (e.time - _.currentTime) * 0.001 * timbre.samplerate;
                    if (_.value !== 0 && samples > 0) {
                        _.eventtype = ParamEvent.ExponentialRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time;
                        _.variation = Math.pow(e.value/_.value, 1/(samples/cell.length));
                    }
                    break;
                }
            }
            
            var changed = false;
            var emit    = false;
            var i, x;
            
            switch (_.eventtype) {
            case ParamEvent.LinearRampToValue:
                if (_.currentTime < _.goalTime) {
                    _.value += _.variation;
                    changed = true;
                }
                break;
            case ParamEvent.ExponentialRampToValue:
                if (_.currentTime < _.goalTime) {
                    _.value *= _.variation;
                    changed = true;
                }
                break;
            }
            _.currentTime += _.currentTimeIncr;
            
            if (_.eventtype !== ParamEvent.None && _.currentTime >= _.goalTime) {
                _.value = _.goalValue;
                _.eventtype = ParamEvent.None;
                changed = emit = true;
            }
            
            if (changed) {
                x = _.value * _.mul + _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
                if (emit) {
                    this.emit("done", _.value);
                }
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("param", Param);
})();
