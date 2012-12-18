(function(timbre) {
    "use strict";

    function WaveListener(_args) {
        timbre.ListenerObject.call(this, _args);

        this._.samples    = 0;
        this._.writeIndex = 0;
        
        this._.plotFlush = true;
        
        this.once("init", oninit);
        
        timbre.fn.fixAR(this);
    }
    timbre.fn.extend(WaveListener, timbre.ListenerObject);
    
    var oninit = function() {
        if (!this._.buffer) {
            this.size = 1024;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
    };
    
    var $ = WaveListener.prototype;
    
    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.buffer) {
                    if (typeof value === "number") {
                        var n = (value < 64) ? 64 : (value > 2048) ? 2048 : value;
                        _.buffer = new Float32Array(n);
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval    = value;
                        _.samplesIncr = value * 0.001 * timbre.samplerate / _.buffer.length;
                        if (_.samplesIncr < 1) {
                            _.samplesIncr = 1;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        var buffer = _.buffer;
        
        for (var i = buffer.length; i--; ) {
            buffer[i] = 0;
        }
        _.samples    = 0;
        _.writeIndex = 0;
        this.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            var samples     = _.samples;
            var samplesIncr = _.samplesIncr;
            var buffer      = _.buffer;
            var writeIndex  = _.writeIndex;
            var emit = false;
            var mul = _.mul, add = _.add;
            var mask = buffer.length - 1;
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[j];
                    writeIndex &= mask;
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                cell[j] = cell[j] * mul + add;
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this.emit("wave");
            }
        }
        
        return cell;
    };
    
    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var buffer = _.buffer;
            var mask   = buffer.length - 1;
            var data   = new Float32Array(buffer.length);
            var j = _.writeIndex;
            for (var i = 0, imax = buffer.length; i < imax; i++) {
                data[i] = buffer[++j & mask];
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return WaveListener.__super__.plot.call(this, opts);
    };
    
    timbre.fn.register("wave", WaveListener);
})(timbre);
