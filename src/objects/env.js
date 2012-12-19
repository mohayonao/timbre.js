(function(timbre) {
    "use strict";
    
    // TODO: loopNode, releaseNode
    
    function Envelope(_args) {
        timbre.Object.call(this, _args);
        
        this._.value0  = 0;
        this._.value1  = 0;
        this._.index   = 0;
        this._.samples = 0;
        this._.curve   = CurveTypeNone;
        this._.goalValue = 0;
        this._.variation = 0;
        this._.status = StatusWait;
        
        this._.defaultCurve = CurveTypeLin;
        this._.table = [0];
        
        this._.kr = true;
    }
    timbre.fn.extend(Envelope, timbre.Object);
    
    var CurveTypeNone = 0;
    var CurveTypeLin  = 1;
    var CurveTypeExp  = 2;
    var StatusWait    = 0;
    var StatusGate    = 1;
    var StatusRelease = 2;
    var StatusEnd     = 3;
    
    var CURVE_TYPES = {
        "lin": CurveTypeLin,
        "exp": CurveTypeExp,
        1: CurveTypeLin,
        2: CurveTypeExp
    };
    var CURVE_NAMES  = [ "lin", "exp" ];
    var STATUS_NAMES = [ "wait", "gate", "release", "end" ];
    
    var $ = Envelope.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.table = value;
                }
            },
            get: function() {
                return this._.table;
            }
        },
        curve: {
            set: function(value) {
                var i = CURVE_TYPES[value];
                if (i !== undefined) {
                    this._.defaultCurve = i;
                    this._.curveName = CURVE_NAMES[i];
                }
            },
            get: function() {
                return this._.defaultCurve;
            }
        },
        index: {
            get: function() {
                return this._.index;
            }
        },
        status: {
            get: function() {
                return STATUS_NAMES[this._.status];
            }
        }
    });
    
    $.reset = function() {
        var _ = this._;
        if (typeof _.table[0] === "number") {
            _.value0 = _.goalValue = _.table[0];
            _.index = 1;
        } else {
            _.value0 = _.goalValue = _.index = 0;
        }
        _.value1  = 1;
        _.samples = 0;
        _.curve   = CurveTypeNone;
        _.variation = 0;
        _.status = StatusWait;
        return this;
    };
    
    $.release = function(time, curve) {
        var _ = this._;
        
        if (_.status !== StatusGate) {
            _.value0  = _.value1 = _.goalValue = 0;
            _.status  = StatusEnd;
            _.samples = Infinity;
            _.curve   = CurveTypeNone;
            this.emit("release-done");
            return this;
        }
        
        _.samples = time * 0.001 * timbre.samplerate;
        if (_.samples > 0) {
            _.value1 = _.value0;
            _.value0 = 1;
            _.curve  = CURVE_TYPES[curve] || _.defaultCurve;
            if (_.curve === CurveTypeExp) {
                if (_.value0 === 0) {
                    _.value0 = 1e-6;
                }
                _.variation = Math.pow(
                    _.goalValue / _.value0, 1 / (_.samples / this.cell.length)
                );
            } else {
                _.curve = CurveTypeLin;
                _.variation = (_.goalValue - _.value0) / (_.samples / this.cell.length);
            }
        }
        _.status = StatusRelease;
        return this;
    };
    
    $.bang = function() {
        var _ = this._;
        this.reset();
        _.status = StatusGate;
        this.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;

            if (inputs.length) {
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
            } else {
                for (j = jmax; j--; ) {
                    cell[j] = 1;
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
                while (_.samples <= 0) {
                    if (_.index >= _.table.length) {
                        _.samples = Infinity;
                        _.value0  = _.goalValue;
                        _.curve   = CurveTypeNone;
                        emit = "done";
                        continue;
                    }
                    items = _.table[_.index++];
                    if (typeof items === "number") {
                        _.value0 = items;
                        continue;
                    }
                    
                    _.value0    = _.goalValue;
                    _.goalValue = items[0] || 0;
                    _.curve  = CURVE_TYPES[items[2]] || _.defaultCurve;
                    
                    time = items[1] || 1000;
                    
                    samples = time * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        if (_.curve === CurveTypeExp) {
                            if (_.value0 === 0) {
                                _.value0 = 1e-6;
                            }
                            _.variation = Math.pow(
                                _.goalValue / _.value0, 1 / (samples / cell.length)
                            );
                        } else {
                            _.curve = CurveTypeLin;
                            _.variation = (_.goalValue - _.value0) / (samples / cell.length);
                        }
                        _.samples += samples;
                    }
                }
                break;
            case StatusRelease:
                if (_.samples <= 0) {
                    emit = "release-done";
                    _.value0  = _.value1 = _.goalValue = 0;
                    _.status  = StatusEnd;
                    _.samples = Infinity;
                    _.curve   = CurveTypeNone;
                }
                break;
            }
            
            value = _.value0 * _.value1;
            for (j = jmax; j--; ) {
                cell[j] = (cell[j] * value) * mul + add;
            }
            
            switch (_.curve) {
            case CurveTypeLin:
                _.value0 += _.variation;
                break;
            case CurveTypeExp:
                _.value0 *= _.variation;
                break;
            }
            _.samples -= cell.length;
            
            if (emit) {
                this.emit(emit);
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("env", Envelope);
})(timbre);
