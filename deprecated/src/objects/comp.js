(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var Compressor = T.modules.Compressor;

    function CompressorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.prevThresh = -24;
        _.prevKnee   =  30;
        _.prevRatio  =  12;
        _.thresh = T(_.prevThresh);
        _.knee   = T(_.prevKnee);
        _.ratio  = T(_.prevRatio);
        _.postGain  = 6;
        _.reduction = 0;
        _.attack = 3;
        _.release = 25;

        _.comp = new Compressor(_.samplerate);
        _.comp.dbPostGain = _.postGain;
        _.comp.setAttackTime(_.attack * 0.001);
        _.comp.setReleaseTime(_.release * 0.001);
        _.comp.setPreDelayTime(6);
        _.comp.setParams(_.prevThresh, _.prevKnee, _.prevRatio);
    }
    fn.extend(CompressorNode);

    var $ = CompressorNode.prototype;

    Object.defineProperties($, {
        thresh: {
            set: function(value) {
                this._.thresh = T(value);
            },
            get: function() {
                return this._.thresh;
            }
        },
        thre: {
            set: function(value) {
                this._.thresh = T(value);
            },
            get: function() {
                return this._.thre;
            }
        },
        knee: {
            set: function(value) {
                this._.kne = T(value);
            },
            get: function() {
                return this._.knee;
            }
        },
        ratio: {
            set: function(value) {
                this._.ratio = T(value);
            },
            get: function() {
                return this._.ratio;
            }
        },
        gain: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.comp.dbPostGain = value;
                }
            },
            get: function() {
                return this._.comp.dbPostGain;
            }
        },
        attack: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.attack = value;
                    this._.comp.setAttackTime(value * 0.001);
                }
            },
            get: function() {
                return this._.attack;
            }
        },
        release: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.release = value;
                    this._.comp.setReleaseTime(value * 0.001);
                }
            },
            get: function() {
                return this._.release;
            }
        },
        reduction: {
            get: function() {
                return this._.reduction;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var thresh = _.thresh.process(tickID).cells[0][0];
            var knee   = _.knee.process(tickID).cells[0][0];
            var ratio  = _.ratio.process(tickID).cells[0][0];
            if (_.prevThresh !== thresh || _.prevKnee !== knee || _.prevRatio !== ratio) {
                _.prevThresh = thresh;
                _.prevKnee   = knee;
                _.prevRatio  = ratio;
                _.comp.setParams(thresh, knee, ratio);
            }

            if (!_.bypassed) {
                _.comp.process(this.cells[1], this.cells[2]);
                _.reduction = _.comp.meteringGain;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("comp", CompressorNode);

})(timbre);
