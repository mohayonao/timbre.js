(function(T) {
    "use strict";

    var fn = T.fn;

    function MapNode(_args) {
        T.Object.call(this, 1, _args);
        var _ = this._;
        _.input  = 0;
        _.value = 0;
        _.prev   = null;
        _.ar     = false;
        _.map    = defaultFunction;
    }
    fn.extend(MapNode);

    var defaultFunction = function(x) {
        return x;
    };

    var $ = MapNode.prototype;

    Object.defineProperties($, {
        input: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.input = value;
                }
            },
            get: function() {
                return this._.input;
            }
        },
        map: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.map = value;
                }
            },
            get: function() {
                return this._.map;
            }
        }
    });

    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };

    $.at = function(input) {
        return (this._.map) ? this._.map(input) : 0;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var len = this.nodes.length;
            var i, imax = cell.length;

            if (_.ar && len) {
                fn.inputSignalAR(this);
                var map = _.map;
                if (map) {
                    for (i = 0; i < imax; ++i) {
                        cell[i] = map(cell[i]);
                    }
                }
                _.value = cell[imax-1];
                fn.outputSignalAR(this);
            } else {
                var input = len ? fn.inputSignalKR(this) : _.input;
                if (_.map && _.prev !== input) {
                    _.prev = input;
                    _.value = _.map(input);
                }
                var value = _.value * _.mul + _.add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
    };

    fn.register("map", MapNode);

})(timbre);
