(function(T) {
    "use strict";

    var fn = T.fn;

    function DivNode(_args) {
        T.Object.call(this, 2, _args);
        this._.ar = false;
    }
    fn.extend(DivNode);

    var $ = DivNode.prototype;

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
            var tmp, tmpL, tmpR, div;

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
                            div = tmpL[j];
                            cellL[j] = (div === 0) ? 0 : cellL[j] / div;
                            div = tmpR[j];
                            cellR[j] = (div === 0) ? 0 : cellR[j] / div;
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
                        div = nodes[i].process(tickID).cells[0][0];
                        tmp = (div === 0) ? 0 : tmp / div;
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

    fn.register("/", DivNode);

})(timbre);
