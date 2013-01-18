(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Scissor    = timbre.modules.Scissor;
    var Tape       = Scissor.Tape;
    var TapeStream = Scissor.TapeStream;
    
    function ScissorNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;
        _.isLooped = false;
        _.isEnded  = false;
    }
    fn.extend(ScissorNode);
    
    var $ = ScissorNode.prototype;
    
    Object.defineProperties($, {
        tape: {
            set: function(tape) {
                if (tape instanceof Tape) {
                    this._.tape = tape;
                    this._.tapeStream = new TapeStream(tape, timbre.samplerate);
                    this._.isEnded = false;
                } else if (typeof tape === "object") {
                    if (tape.buffer instanceof Float32Array) {
                        this._.tape = new Scissor(tape);
                        this._.tapeStream = new TapeStream(tape, timbre.samplerate);
                        this._.isEnded = false;
                    }
                }
            },
            get: function() {
                return this._.tape;
            }
        },
        isLooped: {
            set: function(value) {
                this._.isLooped = !!value;
                if (this._.tapeStream) {
                    this._.tapeStream.isLooped = this._.isLooped;
                }
            },
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
        var cell  = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var tapeStream = _.tapeStream;
            
            if (tapeStream) {
                var mul = _.mul, add = _.add;
                var tmp  = tapeStream.fetch(cell.length);
                var tmpL = tmp[0];
                var tmpR = tmp[1];
                for (var i = cell.length; i--; ) {
                    cell[i] = (tmpL[i] + tmpR[i]) * 0.5 * mul + add;
                }
            }
            
            if (!_.isEnded && tapeStream.isEnded) {
                fn.nextTick(onended.bind(this));
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    fn.register("tape", ScissorNode);
    
})();
