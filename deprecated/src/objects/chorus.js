(function(T) {
    "use strict";

    var fn  = T.fn;
    var Chorus = T.modules.Chorus;

    function ChorusNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var chorus = new Chorus(this._.samplerate);
        chorus.setDelayTime(20);
        chorus.setRate(4);
        chorus.depth = 20;
        chorus.feedback = 0.2;
        chorus.mix = 0.33;
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
                        value *= this._.samplerate / 44100;
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
        mix: {
            set: function(value) {
                this._.mix = T(value);
            },
            get: function() {
                return this._.mix;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                _.chorus.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("chorus", ChorusNode);

})(timbre);
