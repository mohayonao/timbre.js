(function(T) {
    "use strict";

    var fn = T.fn;
    var Tape = T.modules.Scissor.Tape;
    var isSignalArray = function(obj) {
        return fn.isSignalArray(obj) || obj instanceof Float32Array;
    };

    function BufferNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pitch      = T(1);
        _.samplerate = 44100;
        _.channels   = 0;
        _.bufferMix  = null;
        _.buffer     = [];
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
            if (_.phase >= _.buffer[0].length) {
                _.phase = 0;
            } else if (_.phase < 0) {
                _.phase = _.buffer[0].length + _.phaseIncr;
            }
            self._.emit("looped");
        };
    };

    var $ = BufferNode.prototype;

    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var buffer = [], samplerate, channels;

            if (isSignalArray(value)) {
                buffer[0] = value;
                channels = 1;
            } else if (typeof value === "object") {
                if (value instanceof T.Object) {
                    value = value.buffer;
                } else if (value instanceof Tape) {
                    value = value.getBuffer();
                }
                if (Array.isArray(value.buffer)) {
                    if (isSignalArray(value.buffer[0])) {
                        if (isSignalArray(value.buffer[1]) &&
                            isSignalArray(value.buffer[2])) {
                            channels = 2;
                            buffer = value.buffer;
                        } else {
                            channels = 1;
                            buffer = [value.buffer[0]];
                        }
                    }
                } else if (isSignalArray(value.buffer)) {
                    channels = 1;
                    buffer = [value.buffer];
                }
                if (typeof value.samplerate === "number") {
                    samplerate = value.samplerate;
                }
            }
            if (buffer.length) {
                if (samplerate > 0) {
                    _.samplerate = value.samplerate;
                }
                _.bufferMix = null;
                _.buffer  = buffer;
                _.phase     = 0;
                _.phaseIncr = _.samplerate / T.samplerate;
                _.duration  = _.buffer[0].length * 1000 / _.samplerate;
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
                return {
                    samplerate: _.samplerate,
                    channels  : _.channels,
                    buffer    : _.buffer
                };
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
        var instance = fn.clone(this);

        if (_.buffer.length) {
            setBuffer.call(instance, {
                buffer    : _.buffer,
                samplerate: _.samplerate,
                channels  : _.channels
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

        if (_.buffer.length) {
            if (typeof begin === "number" ){
                begin = (begin * 0.001 * _.samplerate)|0;
            } else {
                begin = 0;
            }
            if (typeof end === "number") {
                end   = (end   * 0.001 * _.samplerate)|0;
            } else {
                end = _.buffer[0].length;
            }
            if (begin > end) {
                var tmp = begin;
                begin = end;
                end   = tmp;
                isReversed = !isReversed;
            }

            if (_.channels === 2) {
                setBuffer.call(instance, {
                    buffer   : [ fn.pointer(_.buffer[0], begin, end-begin),
                                 fn.pointer(_.buffer[1], begin, end-begin),
                                 fn.pointer(_.buffer[2], begin, end-begin) ],
                    samplerate: _.samplerate
                });
            } else {
                setBuffer.call(instance, {
                    buffer: fn.pointer(_.buffer[0], begin, end-begin),
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
            if (_.phase === 0 && _.buffer.length) {
                _.phase = _.buffer[0].length + _.phaseIncr;
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

        if (!_.buffer.length) {
            return this;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var phase  = _.phase;
            var i, imax = _.cellsize;

            var bufferL, bufferR;
            if (_.channels === 2) {
                bufferL = _.buffer[1];
                bufferR = _.buffer[2];
            } else {
                bufferL = bufferR = _.buffer[0];
            }

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
        var bufferL, bufferR;
        if (_.plotFlush) {
            if (_.channels === 2) {
                bufferL = _.buffer[1];
                bufferR = _.buffer[2];
            } else {
                bufferL = bufferR = _.buffer[0];
            }
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
