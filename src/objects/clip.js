(function(T) {
    "use strict";

    var fn = T.fn;

    function ClipNode(_args) {
        T.Object.call(this, 2, _args);

        var _ = this._;
        _.min = -0.8;
        _.max = +0.8;
    }
    fn.extend(ClipNode);

    var $ = ClipNode.prototype;

    Object.defineProperties($, {
        minmax: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.min = -Math.abs(value);
                    _.max = -_.min;
                }
            },
            get: function() {
                return this._.max;
            }
        },
        min: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (_.max < value) {
                        _.max = value;
                    } else {
                        _.min = value;
                    }
                }
            },
            get: function() {
                return this._.min;
            }
        },
        max: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (value < _.min) {
                        _.min = value;
                    } else {
                        _.max = value;
                    }
                }
            },
            get: function() {
                return this._.max;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = cellL.length;
            var min = _.min, max = _.max;
            var value;

            if (_.ar) {
                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    value = cellL[i];
                    if (value < min) {
                        value = min;
                    } else if (value > max) {
                        value = max;
                    }
                    cellL[i] = value;
                    value = cellR[i];
                    if (value < min) {
                        value = min;
                    } else if (value > max) {
                        value = max;
                    }
                    cellR[i] = value;
                }
                fn.outputSignalAR(this);
            } else {
                value = fn.inputSignalKR(this);
                if (value < min) {
                    value = min;
                } else if (value > max) {
                    value = max;
                }
                this.cells[0][0] = value;
                fn.outputSignalKR(this);
            }
        }
        return this;
    };

    fn.register("clip", ClipNode);

})(timbre);
