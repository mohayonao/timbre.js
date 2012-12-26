(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function ParamNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        this._.value = 0;
        this._.minvalue = -Infinity;
        this._.maxValue = +Infinity;
        
        this._.eventtype = ParamEvent_None;
        this._.currentTime = 0;
        this._.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        
        this._.schedules = [];
        
        this.on("setAdd", __changeWithValue);
        this.on("setMul", __changeWithValue);
    }
    fn.extend(ParamNode);

    function ParamEvent(type, value, time) {
        this.type  = type;
        this.value = value;
        this.time  = time;
    }
    var ParamEvent_None                   = 0;
    var ParamEvent_SetValue               = 1;
    var ParamEvent_LinearRampToValue      = 2;
    var ParamEvent_ExponentialRampToValue = 3;
    
    var __changeWithValue = fn.changeWithValue;
    
    var $ = ParamNode.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    value = (value < _.minvalue) ?
                        _.minvalue : (value > _.maxValue) ? _.maxValue : value;
                    _.value = isNaN(value) ? 0 : value;
                    _.eventtype = ParamEvent_None;
                    __changeWithValue.call(this);
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
    
    var insertEvent = function(schedules, type, value, time) {
        schedules.push(new ParamEvent(type, value, time));
    };
    
    $.setValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent_SetValue, value, time);
        }
        return this;
    };
    $.setAt = $.setValueAtTime;
    
    $.linearRampToValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent_LinearRampToValue, value, time);
        }
        return this;
    };
    $.lineTo = $.linearRampToValueAtTime;
    
    $.exponentialRampToValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent_ExponentialRampToValue, value, time);
        }
        return this;
    };
    $.expTo = $.exponentialRampToValueAtTime;
    
    $.cancelScheduledValues = function(time) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number") {
            var s = this._.schedules;
            for (var i = 0, imax = s.length; i < imax; ++i) {
                if (time <= s[i].time) {
                    s.splice(i);
                    if (i === 0) {
                        this._.eventtype = ParamEvent_None;
                    }
                    break;
                }
            }
        }
        return this;
    };
    $.cancel = $.cancelScheduledValues;
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var schedules = _.schedules;
            var e, samples;
            
            while (_.eventtype === ParamEvent_None && schedules.length > 0) {
                e = schedules.shift();
                switch (e.type) {
                case ParamEvent_SetValue:
                    _.eventtype = ParamEvent_SetValue;
                    _.goalValue = e.value;
                    _.goalTime  = e.time + _.currentTime;
                    _.isEnded = false;
                    break;
                case ParamEvent_LinearRampToValue:
                    samples = e.time * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        _.eventtype = ParamEvent_LinearRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time + _.currentTime;
                        _.variation = (e.value - _.value) / (samples / cell.length);
                        _.isEnded = false;
                    }
                    break;
                case ParamEvent_ExponentialRampToValue:
                    samples = e.time * 0.001 * timbre.samplerate;
                    if (_.value !== 0 && samples > 0) {
                        _.eventtype = ParamEvent_ExponentialRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time + _.currentTime;
                        _.variation = Math.pow(e.value/_.value, 1/(samples/cell.length));
                        _.isEnded = false;
                    }
                    break;
                }
            }
            
            var changed = false;
            var i, x;

            if (!_.isEnded) {
                switch (_.eventtype) {
                case ParamEvent_LinearRampToValue:
                    if (_.currentTime < _.goalTime) {
                        _.value += _.variation;
                        changed = true;
                    }
                    break;
                case ParamEvent_ExponentialRampToValue:
                    if (_.currentTime < _.goalTime) {
                        _.value *= _.variation;
                        changed = true;
                    }
                    break;
                }
                _.currentTime += _.currentTimeIncr;
                
                if (_.eventtype !== ParamEvent_None && _.currentTime >= _.goalTime) {
                    _.value = _.goalValue;
                    if (schedules.length === 0) {
                        fn.nextTick(onended.bind(this));
                    } else {
                        fn.nextTick(onnext.bind(this));
                    }
                    changed = true;
                }
                
                if (changed) {
                    x = _.value * _.mul + _.add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        this._.eventtype = ParamEvent_None;
        fn.onended(this);
    };
    
    var onnext = function() {
        var _ = this._;
        _.eventtype = ParamEvent_None;
        this._.emit("next", _.value);
    };
    
    fn.register("param", ParamNode);
    
})(timbre);
