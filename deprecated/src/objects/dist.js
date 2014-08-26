(function(T) {
    "use strict";

    var fn = T.fn;

    function DistNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pre  = T( 60);
        _.post = T(-18);
        _.x1L = _.x2L = _.y1L = _.y2L = 0;
        _.x1R = _.x2R = _.y1R = _.y2R = 0;
        _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        _.cutoff = 0;
        _.Q = 1;
        _.preScale = 0;
        _.postScale = 0;
    }
    fn.extend(DistNode);

    var $ = DistNode.prototype;

    Object.defineProperties($, {
        cutoff: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.cutoff = value;
                }
            },
            get: function() {
                return this._.cutoff;
            }
        },
        pre: {
            set: function(value) {
                this._.pre = T(value);
            },
            get: function() {
                return this._.pre;
            }
        },
        post: {
            set: function(value) {
                this._.post = T(value);
            },
            get: function() {
                return this._.post;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var preGain  = -_.pre.process(tickID).cells[0][0];
            var postGain = -_.post.process(tickID).cells[0][0];

            if (_.prevPreGain !== preGain || _.prevPostGain !== postGain) {
                _.prevPreGain  = preGain;
                _.prevPostGain = postGain;
                _.preScale  = Math.pow(10, -preGain  * 0.05);
                _.postScale = Math.pow(10, -postGain * 0.05);
            }

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var preScale  = _.preScale;
                var postScale = _.postScale;
                var i, imax, value, x0, y0;

                if (_.cutoff) {
                    if (_.prevCutoff !== _.cutoff) {
                        _.prevCutoff = _.cutoff;
                        lowpass_params(_);
                    }

                    var x1L = _.x1L, x2L = _.x2L, y1L = _.y1L, y2L = _.y2L;
                    var x1R = _.x1R, x2R = _.x2R, y1R = _.y1R, y2R = _.y2R;
                    var b0 = _.b0, b1 = _.b1, b2 = _.b2, a1 = _.a1, a2 = _.a2;

                    for (i = 0, imax = cellL.length; i < imax; ++i) {
                        x0 = cellL[i] * preScale;
                        y0 = b0 * x0 + b1 * x1L + b2 * x2L - a1 * y1L - a2 * y2L;
                        value = y0 * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellL[i] = value;
                        x2L = x1L; x1L = x0; y2L = y1L; y1L = y0;

                        x0 = cellR[i] * preScale;
                        y0 = b0 * x0 + b1 * x1R + b2 * x2R - a1 * y1R - a2 * y2R;
                        value = y0 * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellR[i] = value;
                        x2R = x1R; x1R = x0; y2R = y1R; y1R = y0;
                    }

                    _.x1L = x1L; _.x2L = x2L; _.y1L = y1L; _.y2L = y2L;
                    _.x1R = x1R; _.x2R = x2R; _.y1R = y1R; _.y2R = y2R;
                } else {
                    for (i = 0, imax = cellL.length; i < imax; ++i) {
                        value = cellL[i] * preScale * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellL[i] = value;

                        value = cellR[i] * preScale * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellR[i] = value;
                    }
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var lowpass_params = function(_) {
        var w0 = 2 * Math.PI * _.cutoff / _.samplerate;
        var cos = Math.cos(w0);
        var sin = Math.sin(w0);
        var alpha = sin / (2 * _.Q);

        var ia0 = 1 / (1 + alpha);
        _.b0 =  (1 - cos) * 0.5 * ia0;
        _.b1 =   1 - cos * ia0;
        _.b2 =  (1 - cos) * 0.5 * ia0;
        _.a1 =  -2 * cos * ia0;
        _.a2 =   1 - alpha * ia0;
    };

    fn.register("dist", DistNode);

})(timbre);
