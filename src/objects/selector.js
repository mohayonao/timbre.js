(function(T) {
    "use strict";

    var fn = T.fn;

    function SelectorNode(_args) {
        T.Object.call(this, 2, _args);

        this._.selected   = 0;
        this._.background = false;
    }
    fn.extend(SelectorNode);

    var $ = SelectorNode.prototype;

    Object.defineProperties($, {
        selected: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.selected = value;
                    this.cells[1].set(fn.emptycell);
                    this.cells[2].set(fn.emptycell);
                }
            },
            get: function() {
                return this._.selected;
            }
        },
        background: {
            set: function(value) {
                this._.background = !!value;
            },
            get: function() {
                return this._.background;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var i, imax = nodes.length;

            if (_.background) {
                for (i = 0; i < imax; ++i) {
                    nodes[i].process(tickID);
                }
            }

            var tmp = nodes[_.selected];
            if (tmp) {
                if (!_.background) {
                    tmp.process(tickID);
                }
                this.cells[1].set(tmp.cells[1]);
                this.cells[2].set(tmp.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("selector", SelectorNode);

})(timbre);
