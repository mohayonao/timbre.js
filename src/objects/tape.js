(function(T) {
    "use strict";
    
    var fn = T.fn;
    var Scissor    = T.modules.Scissor;
    var Tape       = Scissor.Tape;
    var TapeStream = Scissor.TapeStream;
    
    function ScissorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.isLooped = false;
        _.isEnded  = false;
        _.onended  = fn.make_onended(this, 0);
    }
    fn.extend(ScissorNode);
    
    var $ = ScissorNode.prototype;
    
    Object.defineProperties($, {
        tape: {
            set: function(tape) {
                if (tape instanceof Tape) {
                    this._.tape = tape;
                    this._.tapeStream = new TapeStream(tape, T.samplerate);
                    this._.isEnded = false;
                } else if (typeof tape === "object") {
                    if (tape.buffer instanceof Float32Array || tape.buffer instanceof Float64Array) {
                        this._.tape = new Scissor(tape);
                        this._.tapeStream = new TapeStream(tape, T.samplerate);
                        this._.isEnded = false;
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
        isEnded: {
            get: function() {
                return this._.isEnded;
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
        if (this._.tapeStream) {
            this._.tapeStream.reset();
        }
        this._.isEnded = false;
        this._.emit("bang");
        return this;
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
                if (!_.isEnded && tapeStream.isEnded) {
                    fn.nextTick(_.onended);
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    fn.register("tape", ScissorNode);
    
})(timbre);
