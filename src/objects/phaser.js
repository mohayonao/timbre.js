(function(T) {
    "use strict";

    var fn  = T.fn;
    var Biquad = T.modules.Biquad;

    function PhaserNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.freq = T("sin", {freq:1, add:1000, mul:250}).kr();
        _.Q    = T(1);
        _.allpass  = [];

        this.steps = 2;
    }
    fn.extend(PhaserNode);

    var $ = PhaserNode.prototype;

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
                this._.Q = T(value);
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
                                allpass[i] = new Biquad(this._.samplerate);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var freq  = _.freq.process(tickID).cells[0][0];
                var Q     = _.Q.process(tickID).cells[0][0];
                var steps = _.steps;
                var i;

                for (i = 0; i < steps; i += 2) {
                    _.allpass[i  ].setParams(freq, Q, 0);
                    _.allpass[i  ].process(cellL, cellR);
                    _.allpass[i+1].setParams(freq, Q, 0);
                    _.allpass[i+1].process(cellL, cellR);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("phaser", PhaserNode);

})(timbre);
