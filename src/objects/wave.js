(function(timbre) {
    "use strict";

    function WaveListener(_args) {
        timbre.ListenerObject.call(this, _args);
        
        this._.buffer = new Float32Array(2048);
        this._.samples    = 0;
        this._.writeIndex = 0;
        
        this._.plotFlush = true;
        
        this.once("init", function() {
            if (!this._.interval) {
                this.interval = 1000;
            }
        });
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(WaveListener, timbre.ListenerObject);
    
    var $ = WaveListener.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number" && value > 0) {
                    _.interval    = value;
                    _.samplesIncr = value * 0.001 * timbre.samplerate / 2048;
                    if (_.samplesIncr < 1) {
                        _.samplesIncr = 1;
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
        
        for (var i = 2048; i--; ) {
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
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[j];
                    writeIndex &= 2047;
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
            var data   = new Float32Array(2048);
            var buffer = _.buffer;
            for (var i = 0, j = _.writeIndex; i < 2048; i++) {
                data[i] = buffer[++j & 2047];
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return WaveListener.__super__.plot.call(this, opts);
    };
    
    timbre.fn.register("wave", WaveListener);
})(timbre);
