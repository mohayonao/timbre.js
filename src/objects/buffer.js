(function(T) {
    "use strict";
    
    var fn = T.fn;
    var isSignalArray = fn.isSignalArray;
    
    function BufferNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pitch      = T(1);
        _.samplerate = 44100;
        _.channels   = 0;
        _.bufferMix  = null;
        _.bufferL    = new Float32Array(0);
        _.bufferR    = _.bufferL;
        _.isLooped   = false;
        _.isReversed = false;
        _.duration    = 0;
        _.currentTime = 0;
        _.currentTimeObj = null;
        _.phase = 0;
        _.phaseIncr = 0;
        _.onended  = fn.make_onended(this, 0);
        _.onlooped = make_onlooped(this);
    }
    fn.extend(BufferNode);
    
    var make_onlooped = function(self) {
        return function() {
            var _ = self._;
            if (_.phase >= _.bufferL.length) {
                _.phase = 0;
            } else if (_.phase < 0) {
                _.phase = _.bufferL.length + _.phaseIncr;
            }
            self._.emit("looped");
        };
    };
    
    var $ = BufferNode.prototype;
    
    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var bufferL, bufferR, samplerate, channels;
            if (isSignalArray(value)) {
                bufferL  = bufferR = value;
                channels = 1;
            } else if (typeof value === "object") {
                if (isSignalArray(value.bufferL) && isSignalArray(value.bufferR)) {
                    channels = 2;
                    bufferL = value.bufferL;
                    bufferR = value.bufferR;
                } else if (isSignalArray(value.buffer)) {
                    bufferL = bufferR = value.buffer;
                    channels = 1;
                }
                if (typeof value.samplerate === "number") {
                    samplerate = value.samplerate;
                }
            }
            if (bufferL && bufferR) {
                if (samplerate > 0) {
                    _.samplerate = value.samplerate;
                }
                _.bufferMix = null;
                _.bufferL = bufferL;
                _.bufferR = bufferR;
                _.phase     = 0;
                _.phaseIncr = _.samplerate / T.samplerate;
                _.duration  = _.bufferL.length * 1000 / _.samplerate;
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
                var _ = this._;
                if (_.channels === 2) {
                    if (!_.bufferMix) {
                        var bufferMix = new Float32Array(_.bufferL);
                        var bufferR   = _.bufferR;
                        for (var i = 0, imax = _.bufferMix.length; i < imax; i++) {
                            bufferMix[i] = (bufferMix[i] + bufferR[i]) * 0.5;
                        }
                        _.bufferMix = bufferMix;
                    }
                    return _.bufferMix;
                }
                return _.bufferL;
            }
        },
        bufferL: {
            get: function() {
                return this._.bufferL;
            }
        },
        bufferR: {
            get: function() {
                return this._.bufferR;
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
        
        if (_.bufferL) {
            if (_.channels === 2) {
                setBuffer.call(instance, {
                    bufferL   : _.bufferL,
                    bufferR   : _.bufferR,
                    samplerate: _.samplerate
                });
            } else {
                setBuffer.call(instance, {
                    buffer    : _.bufferL,
                    samplerate: _.samplerate
                });
            }
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
            end = _.bufferL.length;
        }
        if (begin > end) {
            var tmp = begin;
            begin = end;
            end   = tmp;
            isReversed = !isReversed;
        }
        
        if (_.bufferL) {
            if (_.channels === 2) {
                setBuffer.call(instance, {
                    bufferL   : fn.pointer(_.bufferL, begin, end-begin),
                    bufferR   : fn.pointer(_.bufferR, begin, end-begin),
                    samplerate: _.samplerate
                });
            } else {
                setBuffer.call(instance, {
                    buffer: fn.pointer(_.bufferL, begin, end-begin),
                    samplerate: _.samplerate
                });
            }
            instance.playbackState = fn.PLAYING_STATE;
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
                _.phase = _.bufferL.length + _.phaseIncr;
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
        this.playbackState = (value === false ? fn.FINISHED_STATE : fn.PLAYING_STATE);
        this._.phase = 0;
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (!_.bufferL) {
            return this;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var bufferL = _.bufferL;
            var bufferR = _.bufferR;
            var phase  = _.phase;
            var i, imax = _.cellsize;
            
            if (_.currentTimeObj) {
                var pos = _.currentTimeObj.process(tickID).cells[0];
                var t, sr = _.samplerate * 0.001;
                for (i = 0; i < imax; ++i) {
                    t = pos[i];
                    phase = t * sr;
                    cellL[i] = (bufferL[phase|0] || 0);
                    cellR[i] = (bufferR[phase|0] || 0);
                }
                _.phase = phase;
                _.currentTime = t;
            } else {
                var pitch  = _.pitch.process(tickID).cells[0][0];
                var phaseIncr = _.phaseIncr * pitch;
                
                for (i = 0; i < imax; ++i) {
                    cellL[i] = (bufferL[phase|0] || 0);
                    cellR[i] = (bufferR[phase|0] || 0);
                    phase += phaseIncr;
                }
                
                if (phase >= bufferL.length) {
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
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    var super_plot = T.Object.prototype.plot;
    
    $.plot = function(opts) {
        var _ = this._;
        var bufferL = _.bufferL;
        var bufferR = _.bufferR;
        if (_.plotFlush) {
            var data = new Float32Array(2048);
            var x = 0, xIncr = bufferL.length / 2048;
            for (var i = 0; i < 2048; i++) {
                data[i] = (bufferL[x|0] + bufferR[x|0]) * 0.5;
                x += xIncr;
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("buffer", BufferNode);
    
})(timbre);
