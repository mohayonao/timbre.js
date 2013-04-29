(function(T) {
    "use strict";

    var fn = T.fn;
    var Scissor    = T.modules.Scissor;
    var Tape       = Scissor.Tape;
    var TapeStream = Scissor.TapeStream;
    var isSignalArray = fn.isSignalArray;

    function ScissorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.isLooped = false;
        _.onended  = fn.make_onended(this, 0);
    }
    fn.extend(ScissorNode);

    var $ = ScissorNode.prototype;

    Object.defineProperties($, {
        tape: {
            set: function(tape) {
                if (tape instanceof Tape) {
                    this.playbackState = fn.PLAYING_STATE;
                    this._.tape = tape;
                    this._.tapeStream = new TapeStream(tape, this._.samplerate);
                    this._.tapeStream.isLooped = this._.isLooped;
                } else {
                    if (tape instanceof T.Object) {
                        if (tape.buffer) {
                            tape = tape.buffer;
                        }
                    }
                    if (typeof tape === "object") {
                        if (Array.isArray(tape.buffer) && isSignalArray(tape.buffer[0])) {
                            this.playbackState = fn.PLAYING_STATE;
                            this._.tape = new Scissor(tape);
                            this._.tapeStream = new TapeStream(this._.tape, this._.samplerate);
                            this._.tapeStream.isLooped = this._.isLooped;
                        }
                    }
                }
            },
            get: function() {
                return this._.tape;
            }
        },
        isLooped: {
            get: function() {
                return this._.isLooped;
            }
        },
        buffer: {
            get: function() {
                if (this._.tape) {
                    return this._.tape.getBuffer();
                }
            }
        }
    });

    $.loop = function(value) {
        this._.isLooped = !!value;
        if (this._.tapeStream) {
            this._.tapeStream.isLooped = this._.isLooped;
        }
        return this;
    };

    $.bang = function() {
        this.playbackState = fn.PLAYING_STATE;
        if (this._.tapeStream) {
            this._.tapeStream.reset();
        }
        this._.emit("bang");
        return this;
    };

    $.getBuffer = function() {
        if (this._.tape) {
            return this._.tape.getBuffer();
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var tapeStream = _.tapeStream;

            if (tapeStream) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var tmp  = tapeStream.fetch(cellL.length);
                cellL.set(tmp[0]);
                cellR.set(tmp[1]);
                if (this.playbackState === fn.PLAYING_STATE && tapeStream.isEnded) {
                    fn.nextTick(_.onended);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("tape", ScissorNode);

})(timbre);
