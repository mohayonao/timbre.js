(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var StereoDelay = T.modules.StereoDelay;

    function DelayNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.time  = T(100);
        _.fb    = T(0.2);
        _.cross = T(false);
        _.mix   = 0.33;

        _.delay = new StereoDelay(_.samplerate);
    }
    fn.extend(DelayNode);

    var $ = DelayNode.prototype;

    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                this._.time = T(value);
            },
            get: function() {
                return this._.time;
            }
        },
        fb: {
            set: function(value) {
                this._.fb = T(value);
            },
            get: function() {
                return this._.fb;
            }
        },
        cross: {
            set: function(value) {
                this._.cross = T(value);
            },
            get: function() {
                return this._.cross;
            }
        },
        mix: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.mix = value;
                }
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

            var time  = _.time.process(tickID).cells[0][0];
            var fb    = _.fb.process(tickID).cells[0][0];
            var cross = _.cross.process(tickID).cells[0][0] !== 0;
            var mix   = _.mix;

            if (_.prevTime !== time || _.prevFb !== fb || _.prevCross !== cross || _.prevMix !== mix) {
                _.prevTime  = time;
                _.prevFb    = fb;
                _.prevCross = cross;
                _.prevMix   = mix;
                _.delay.setParams(time, fb, cross, mix);
            }

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                _.delay.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("delay", DelayNode);

})(timbre);
