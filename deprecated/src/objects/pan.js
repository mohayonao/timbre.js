(function(T) {
    "use strict";

    var fn = T.fn;

    function PanNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pos  = T(0);
        _.panL = 0.5;
        _.panR = 0.5;
    }
    fn.extend(PanNode);

    var $ = PanNode.prototype;

    Object.defineProperties($, {
        pos: {
            set: function(value) {
                this._.pos = T(value);
            },
            get: function() {
                return this._.pos;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var pos = _.pos.process(tickID).cells[0][0];
            if (_.prevPos !== pos) {
                var index = pos * 0.5 + 0.5;
                _.panL = 1 - pos;
                _.panR = _.prevPos = pos;
            }

            var nodes = this.nodes;
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cellL.length;
            var tmp;

            if (imax) {
                tmp = nodes[0].process(tickID).cells[0];
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellR[j] = tmp[j];
                }
                for (i = 1; i < imax; ++i) {
                    tmp = nodes[i].process(tickID).cells[0];
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = (cellR[j] += tmp[j]);
                    }
                }

                var panL = _.panL;
                var panR = _.panR;
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellL[j] * panL;
                    cellR[j] = cellR[j] * panR;
                }

            } else {
                cellL.set(fn.emptycell);
                cellR.set(fn.emptycell);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("pan", PanNode);

})(timbre);
