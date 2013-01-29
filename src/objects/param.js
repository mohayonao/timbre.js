(function(T) {
    "use strict";
    
    var fn = T.fn;
    var timevalue = T.timevalue;
    var Envelope      = T.modules.Envelope;
    var EnvelopeValue = T.modules.EnvelopeValue;
    
    function ParamNode(_args) {
        T.Object.call(this, _args);
        
        var _ = this._;
        _.value = 0;
        _.env = new EnvelopeValue(T.samplerate);
        _.env.step = this.cell.length;
        _.curve   = "lin";
        _.counter = 0;
        _.ar = false;
        
        this.on("ar", onar);
    }
    fn.extend(ParamNode);
    
    var onar = function(value) {
        this._.env.step = (value) ? 1 : this.cell.length;
    };
    
    var $ = ParamNode.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.env.value = value;
                }
            },
            get: function() {
                return this._.env.value;
            }
        }
    });
    
    $.to = function(nextValue, time, curve) {
        var _ = this._;
        var env = _.env;
        if (typeof time === "string") {
            time = timevalue(time);
        } else if (typeof time === "undefined") {
            time = 0;
        }
        if (typeof curve === "undefined") {
            _.counter = env.setNext(nextValue, time, Envelope.CurveTypeLin);
            _.curve = "lin";
        } else {
            var _curve = Envelope.CurveTypeDict[curve];
            if (typeof _curve === "undefined") {
                _.counter = env.setNext(nextValue, time, Envelope.CurveTypeCurve, curve);
            } else {
                _.counter = env.setNext(nextValue, time, _curve);
            }
            _.curve = curve;
        }
        _.plotFlush = true;
        return this;
    };
    
    $.setAt = function(nextValue, time) {
        var _ = this._;
        this.to(_.env.value, time, "set");
        _.atValue = nextValue;
        return this;
    };
    
    $.linTo = function(nextValue, time) {
        return this.to(nextValue, time, "lin");
    };
    
    $.expTo = function(nextValue, time) {
        return this.to(nextValue, time, "exp");
    };
    
    $.sinTo = function(nextValue, time) {
        return this.to(nextValue, time, "sin");
    };
    
    $.welTo = function(nextValue, time) {
        return this.to(nextValue, time, "wel");
    };
    
    $.sqrTo = function(nextValue, time) {
        return this.to(nextValue, time, "sqr");
    };
    
    $.cubTo = function(nextValue, time) {
        return this.to(nextValue, time, "cub");
    };
    
    $.cancel = function() {
        var _ = this._;
        _.counter = _.env.setNext(_.env.value, 0, Envelope.CurveTypeSet);
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
            var env = _.env;
            var counter = _.counter;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            if (counter-- > 0) {
                if (counter <= 0) {
                    if (_.curve === "set") {
                        env.setNext(_.atValue, 0, Envelope.CurveTypeSet);
                    } else {
                        env.setNext(env.value, 0, Envelope.CurveTypeSet);
                    }
                    fn.nextTick(fn.onended.bind(null, this));
                }
                _.counter = counter;
            }
            
            var value, emit = null;
            if (_.ar) {
                for (i = 0; i < imax; ++i) {
                    value = env.next();
                    cell[i] = (cell[i] * value) * mul + add;
                    if (emit === null) {
                        emit = _.env.emit;
                    }
                }
            } else {
                value = env.next();
                for (i = imax; i--; ) {
                    cell[i] = (cell[i] * value) * mul + add;
                }
                emit = _.env.emit;
            }
            _.value = value;
        }
        
        return cell;
    };
    
    var super_plot = T.Object.prototype.plot;
    
    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var env  = new EnvelopeValue(128);
            var data = new Float32Array(128);
            var curve, i, imax;
            if (_.curve === "set") {
                for (i = 100, imax = data.length; i < imax; ++i) {
                    data[i] = 1;
                }
            } else {
                curve = Envelope.CurveTypeDict[_.curve];
                if (typeof curve === "undefined") {
                    env.setNext(1, 1000, Envelope.CurveTypeCurve, _.curve);
                } else {
                    env.setNext(1, 1000, curve);
                }
                
                for (i = 0, imax = data.length; i < imax; ++i) {
                    data[i] = env.next();
                }
            }
            _.plotData  = data;
            _.plotRange = [0, 1];
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("param", ParamNode);
    
})(timbre);
