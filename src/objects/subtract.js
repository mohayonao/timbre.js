(function(T) {
    "use strict";

    var fn = T.fn;

    function SubtractNode(_args) {
        T.Object.call(this, 2, _args);
        this._.ar = false;
    }
    fn.extend(SubtractNode);

    var $ = SubtractNode.prototype;

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var cell  = this.cells[0];
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, tmpL, tmpR;

            if (_.ar) {
                if (nodes.length > 0) {
                    nodes[0].process(tickID);
                    tmpL = nodes[0].cells[1];
                    tmpR = nodes[0].cells[2];
                    cellL.set(tmpL);
                    cellR.set(tmpR);
                    for (i = 1; i < imax; ++i) {
                        nodes[i].process(tickID);
                        tmpL = nodes[i].cells[1];
                        tmpR = nodes[i].cells[2];
                        for (j = 0; j < jmax; ++j) {
                            cellL[j] -= tmpL[j];
                            cellR[j] -= tmpR[j];
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = cellR[i] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        tmp -= nodes[i].process(tickID).cells[0][0];
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

    fn.register("-", SubtractNode);

})(timbre);
