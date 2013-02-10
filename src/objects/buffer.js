(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function BufferNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pitch      = T(1);
        _.buffer     = new Float32Array(0);
        _.isLooped   = false;
        _.isReversed = false;
        _.duration    = 0;
        _.currentTime = 0;
        _.currentTimeObj = null;
        _.samplerate  = 44100;
        _.phase = 0;
        _.phaseIncr = 0;
        _.onended  = fn.make_onended(this, 0);
        _.onlooped = make_onlooped(this);
    }
    fn.extend(BufferNode);
    
    var make_onlooped = function(self) {
        return function() {
            var _ = self._;
            if (_.phase >= _.buffer.length) {
                _.phase = 0;
            } else if (_.phase < 0) {
                _.phase = _.buffer.length + _.phaseIncr;
            }
            self._.emit("looped");
        };
    };
    
    var $ = BufferNode.prototype;
    
    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var buffer, samplerate;
            if (value instanceof Float32Array || value instanceof Float64Array) {
                buffer = value;
            } else if (value.buffer instanceof Float32Array || value.buffer instanceof Float64Array) {
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
                _.phaseIncr = _.samplerate / T.samplerate;
                _.duration  = _.buffer.length * 1000 / _.samplerate;
                _.currentTime = 0;
                _.plotFlush = true;
                this.reverse(_.isReversed);
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
                this._.pitch = T(value);
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
                } else if (value instanceof T.Object) {
                    this._.currentTimeObj = value;
                } else if (value === null) {
                    this._.currentTimeObj = null;
                }
            },
            get: function() {
                if (this._.currentTimeObj) {
                    return this._.currentTimeObj;
                } else {
                    return this._.currentTime;
                }
            }
        }
    });
    
    $.clone = function() {
        var _ = this._;
        var instance = T("buffer");
        
        if (_.buffer) {
            setBuffer.call(instance, {
                buffer    : _.buffer,
                samplerate: _.samplerate
            });
        }
        instance.loop(_.isLooped);
        instance.reverse(_.isReversed);
        
        return instance;
    };
    
    $.slice = function(begin, end) {
        var _ = this._;
        var instance = T(_.originkey);
        
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
        instance.loop(_.isLooped);
        instance.reverse(_.isReversed);
        
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
        var cell = this.cells[0];
        
        if (_.isEnded || !_.buffer) {
            return this;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var buffer = _.buffer;
            var phase  = _.phase;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;
            
            if (_.currentTimeObj) {
                var pos = _.currentTimeObj.process(tickID).cells[0];
                var t, sr = _.samplerate * 0.001;
                for (i = 0; i < imax; ++i) {
                    t = pos[i];
                    phase = t * sr;
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                }
                _.phase = phase;
                _.currentTime = t;
            } else {
                var pitch  = _.pitch.process(tickID).cells[0][0];
                var phaseIncr = _.phaseIncr * pitch;
                
                for (i = 0; i < imax; ++i) {
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                    phase += phaseIncr;
                }
                
                if (phase >= buffer.length) {
                    if (_.isLooped) {
                        fn.nextTick(_.onlooped);
                    } else {
                        fn.nextTick(_.onended);
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        fn.nextTick(_.onlooped);
                    } else {
                        fn.nextTick(_.onended);
                    }
                }
                _.phase = phase;
                _.currentTime += fn.currentTimeIncr;
            }
        }
        
        return this;
    };
    
    var super_plot = T.Object.prototype.plot;
    
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
    
})(timbre);
