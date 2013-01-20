(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var Biquad = timbre.modules.Biquad;

    function PhaseShiftNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.buffer = new Float32Array(timbre.cellsize);
        _.freq   = timbre("sin", {freq:1, add:1000, mul:250}).kr();
        _.Q      = timbre(1);
        _.allpass  = [];
        
        this.steps = 2;
    }
    fn.extend(PhaseShiftNode);
    
    var $ = PhaseShiftNode.prototype;
    
    Object.defineProperties($, {
        freq: {
            set: function(value) {
                this._.freq = value;
            },
            get: function() {
                return this._.freq;
            }
        },
        Q: {
            set: function(value) {
                this._.Q = timbre(value);
            },
            get: function() {
                return this._.Q;
            }
        },
        steps: {
            set: function(value) {
                if (typeof value === "number") {
                    value |= 0;
                    if (value === 2 || value === 4 || value === 8 || value === 12) {
                        var allpass = this._.allpass;
                        if (allpass.length < value) {
                            for (var i = allpass.length; i < value; ++i) {
                                allpass[i] = new Biquad(timbre.samplerate);
                                allpass[i].setType("allpass");
                            }
                        }
                    }
                    this._.steps = value;
                }
            },
            get: function() {
                return this._.steps;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var freq  = _.freq.process(tickID)[0];
            var Q     = _.Q.process(tickID)[0];
            var steps = _.steps;
            var i;
            
            _.buffer.set(cell);
            
            for (i = steps; i--; ) {
                _.allpass[i].setParams(freq, Q, 0);
                _.allpass[i].process(_.buffer);
                i--;
                _.allpass[i].setParams(freq, Q, 0);
                _.allpass[i].process(_.buffer);
            }
            
            for (i = cell.length; i--; ) {
                cell[i] = (cell[i] + _.buffer[i]) * 0.5;
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("phaseshift", PhaseShiftNode);
    
})();
