(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Envelope = timbre.modules.Envelope;
    
    function ParamNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        var _ = this._;
        _.env = new Envelope(timbre.samplerate);
        _.env.step = this.cell.length;
        _.curve = "lin";
    }
    fn.extend(ParamNode);
    
    var $ = ParamNode.prototype;

    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var env = this._.env;
                    env.setTable([value, [value, 0]]);
                    env.reset();
                    env.status = Envelope.StatusGate;
                }
            },
            get: function() {
                return this._.env.value;
            }
        }
    });
    
    $.to = function(nextValue, time, curve) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, curve]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = curve;
        this._.plotFlush = true;
        return this;
    };
    
    $.setAt = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [env.value, time], [nextValue, 0]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "set";
        this._.plotFlush = true;
        return this;
    };
    
    $.linTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "lin"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "lin";
        this._.plotFlush = true;
        return this;
    };
    
    $.expTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "exp"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "exp";
        this._.plotFlush = true;
        return this;
    };
    
    $.sinTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "sin"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "sin";
        this._.plotFlush = true;
        return this;
    };
    
    $.welTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "wel"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "wel";
        this._.plotFlush = true;
        return this;
    };
    
    $.sqrTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "sqr"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "sqr";
        this._.plotFlush = true;
        return this;
    };
    
    $.cubTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "cub"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "cub";
        this._.plotFlush = true;
        return this;
    };
    
    $.cancel = function() {
        this._.env.status = Envelope.StatusWait;
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
        fn.onended(this);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var env = new Envelope(128);
            
            var table;
            if (this._.curve === "set") {
                table = [0, [0, 900], [1, 0]];
            } else {
                table = [0, [1, 1000, this._.curve]];
            }
            
            env.setTable(table);
            env.status = Envelope.StatusGate;
            
            var data = new Float32Array(128);
            var i, imax;

            for (i = 0, imax = data.length; i < imax; ++i) {
                data[i] = env.next();
            }
            
            this._.plotData  = data;
            this._.plotRange = [0, 1];
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("param", ParamNode);
    
})();
