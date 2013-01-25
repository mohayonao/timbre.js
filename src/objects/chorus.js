(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var Chorus = timbre.modules.Chorus;
    
    function ChorusNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var chorus = new Chorus(timbre.samplerate);
        chorus.setDelayTime(20);
        chorus.setRate(4);
        chorus.depth = 20;
        chorus.feedback = 0.2;
        chorus.wet = 0.5;
        this._.chorus = chorus;
    }
    fn.extend(ChorusNode);
    
    var $ = ChorusNode.prototype;

    Object.defineProperties($, {
        type: {
            set: function(value) {
                this._.chorus.setDelayTime(value);
            },
            get: function() {
                return this._.chorus.wave;
            }
        },
        delay: {
            set: function(value) {
                if (0.5 <= value && value <= 80) {
                    this._.chorus.setDelayTime(value);
                }
            },
            get: function() {
                return this._.chorus.delayTime;
            }
        },
        rate: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.chorus.setRate(value);
                }
            },
            get: function() {
                return this._.chorus.rate;
            }
        },
        depth: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 <= value && value <= 100) {
                        value *= timbre.samplerate / 44100;
                        this._.chorus.depth = value;
                    }
                }
            },
            get: function() {
                return this._.chorus.depth;
            }
        },
        fb: {
            set: function(value) {
                if (typeof value === "number") {
                    if (-1 <= value && value <= 1) {
                        this._.chorus.feedback = value * 0.99996;
                    }
                }
            },
            get: function() {
                return this._.chorus.feedback;
            }
        },
        wet: {
            set: function(value) {
                this._.wet = timbre(value);
            },
            get: function() {
                return this._.wet;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            if (!_.bypassed) {
                _.chorus.process(cell);
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("chorus", ChorusNode);
    
})();
