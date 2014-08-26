(function(T) {
    "use strict";

    var fn = T.fn;

    function MinNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(MinNode);

    var $ = MinNode.prototype;

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, val;

            if (_.ar) {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0];
                    cell.set(tmp);
                    for (i = 1; i < imax; ++i) {
                        tmp = nodes[i].process(tickID).cells[0];
                        for (j = 0; j < jmax; ++j) {
                            val = tmp[j];
                            if (cell[j] > val) {
                                cell[j] = val;
                            }
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cell[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        val = nodes[i].process(tickID).cells[0][0];
                        if (tmp > val) {
                            tmp = val;
                        }
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("min", MinNode);

})(timbre);
