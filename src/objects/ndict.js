(function(T) {
    "use strict";

    var fn = T.fn;

    function NDictNode(_args) {
        T.Object.call(this, 1, _args);

        var _ = this._;
        _.defaultValue = 0;
        _.index = 0;
        _.dict  = {};
        _.ar    = false;
    }
    fn.extend(NDictNode);

    var $ = NDictNode.prototype;

    Object.defineProperties($, {
        dict: {
            set: function(value) {
                if (typeof value === "object") {
                    this._.dict = value;
                } else if (typeof value === "function") {
                    var dict = {};
                    for (var i = 0; i < 128; ++i) {
                        dict[i] = value(i);
                    }
                    this._.dict = dict;
                }
            },
            get: function() {
                return this._.dict;
            }
        },
        defaultValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.defaultValue = value;
                }
            },
            get: function() {
                return this._.defaultValue;
            }
        },
        index: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.index = value;
                }
            },
            get: function() {
                return this._.index;
            }
        }
    });

    $.at = function(index) {
        var _ = this._;
        return (_.dict[index|0] || _.defaultValue) * _.mul + _.add;
    };

    $.clear = function() {
        this._.dict = {};
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var len = this.nodes.length;
            var index, value;
            var dict = _.dict, defaultValue = _.defaultValue;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;

            if (_.ar && len) {

                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    index = cell[i];
                    if (index < 0) {
                        index = (index - 0.5)|0;
                    } else {
                        index = (index + 0.5)|0;
                    }
                    cell[i] = (dict[index] || defaultValue) * mul + add;
                }
                fn.outputSignalAR(this);
            } else {
                index = (this.nodes.length) ? fn.inputSignalKR(this) : _.index;
                if (index < 0) {
                    index = (index - 0.5)|0;
                } else {
                    index = (index + 0.5)|0;
                }
                value = (dict[index] || defaultValue) * mul + add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
    };

    fn.register("ndict", NDictNode);

})(timbre);
