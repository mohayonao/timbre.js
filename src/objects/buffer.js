(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function BufferNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pitch      = timbre(1);
        _.buffer     = new Float32Array(0);
        _.isLooped   = false;
        _.isReversed = false;
        _.duration    = 0;
        _.currentTime = 0;
        _.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        _.samplerate  = 44100;
        _.phase = 0;
        _.phaseIncr = 0;
        
        this.on("play", onplay);
    }
    fn.extend(BufferNode);
    
    var onplay = function(value) {
        this._.isEnded = (value === false);
    };
    
    var $ = BufferNode.prototype;
    
    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var buffer, samplerate;
            if (value instanceof Float32Array) {
                buffer = value;
            } else if (value.buffer instanceof Float32Array) {
                buffer = value.buffer;
                if (typeof value.samplerate === "number") {
                    samplerate = value.samplerate;
                }
            }
            if (buffer) {
                if (samplerate > 0) {
                    _.samplerate = value.samplerate;
                }
                _.buffer = buffer;
                _.phase     = 0;
                _.phaseIncr = _.samplerate / timbre.samplerate;
                _.duration  = _.buffer.length * 1000 / _.samplerate;
                _.currentTime = 0;
                _.plotFlush = true;
                this.isReversed = _.isReversed;
            }
        }
    };
    
    Object.defineProperties($, {
        buffer: {
            set: setBuffer,
            get: function() {
                return this._.buffer;
            }
        },
        pitch: {
            set: function(value) {
                this._.pitch = timbre(value);
            },
            get: function() {
                return this._.pitch;
            }
        },
        isLooped: {
            get: function() {
                return this._.isLooped;
            }
        },
        isReversed: {
            get: function() {
                return this._.isReversed;
            }
        },
        isEnded: {
            get: function() {
                return this._.isEnded;
            }
        },
        samplerate: {
            get: function() {
                return this._.samplerate;
            }
        },
        duration: {
            get: function() {
                return this._.duration;
            }
        },
        currentTime: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    if (0 <= value && value <= _.duration) {
                        _.phase = (value / 1000) * _.samplerate;
                        _.currentTime = value;
                    }
                }
            },
            get: function() {
                return this._.currentTime;
            }
        }
    });

    $.clone = function() {
        var _ = this._;
        var instance = timbre("buffer");
        
        if (_.buffer) {
            setBuffer.call(instance, {
                buffer    : _.buffer,
                samplerate: _.samplerate
            });
        }
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.slice = function(begin, end) {
        var _ = this._;
        var instance = timbre(_.originkey);
        
        var isReversed = _.isReversed;
        if (typeof begin === "number" ){
            begin = (begin * 0.001 * _.samplerate)|0;
        } else {
            begin = 0;
        }
        if (typeof end === "number") {
            end   = (end   * 0.001 * _.samplerate)|0;
        } else {
            end = _.buffer.length;
        }
        if (begin > end) {
            var tmp = begin;
            begin = end;
            end   = tmp;
            isReversed = !isReversed;
        }
        
        if (_.buffer) {
            setBuffer.call(instance, {
                buffer    : _.buffer.subarray(begin, end),
                samplerate: _.samplerate
            });
            instance._.isEnded = false;
        }
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.reverse = function(value) {
        var _ = this._;
        
        _.isReversed = !!value;
        if (_.isReversed) {
            if (_.phaseIncr > 0) {
                _.phaseIncr *= -1;
            }
            if (_.phase === 0 && _.buffer) {
                _.phase = _.buffer.length + _.phaseIncr;
            }
        } else {
            if (_.phaseIncr < 0) {
                _.phaseIncr *= -1;
            }
        }
        
        return this;
    };

    $.loop = function(value) {
        this._.isLooped = !!value;
        return this;
    };
    
    $.bang = function(value) {
        this._.phase   = 0;
        this._.isEnded = (value === false);
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (_.isEnded && !_.buffer) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var buffer = _.buffer;
            var phase  = _.phase;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;
            
            if (this.inputs.length) {
                fn.inputSignalAR(this);
                var t, sr = _.samplerate * 0.001;
                for (i = 0; i < imax; ++i) {
                    t = cell[i];
                    phase = t * sr;
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                }
                _.phase = phase;
                _.currentTime = t;
            } else {
                var pitch  = _.pitch.process(tickID)[0];
                var phaseIncr = _.phaseIncr * pitch;
                
                for (i = 0; i < imax; ++i) {
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                    phase += phaseIncr;
                }
                
                if (phase >= buffer.length) {
                    if (_.isLooped) {
                        fn.nextTick(onlooped.bind(this));
                    } else {
                        fn.nextTick(onended.bind(this));
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        fn.nextTick(onlooped.bind(this));
                    } else {
                        fn.nextTick(onended.bind(this));
                    }
                }
                _.phase = phase;
                _.currentTime += _.currentTimeIncr;
            }
        }
        
        return cell;
    };
    
    var onlooped = function() {
        var _ = this._;
        if (_.phase >= _.buffer.length) {
            _.phase = 0;
        } else if (_.phase < 0) {
            _.phase = _.buffer.length + _.phaseIncr;
        }
        this._.emit("looped");
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        var _ = this._;
        var buffer = _.buffer;
        if (_.plotFlush) {
            var data = new Float32Array(2048);
            var x = 0, xIncr = buffer.length / 2048;
            for (var i = 0; i < 2048; i++) {
                data[i] = buffer[x|0];
                x += xIncr;
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("buffer", BufferNode);
    
})();
