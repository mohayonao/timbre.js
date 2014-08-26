(function(T) {
    "use strict";

    var fn = T.fn;

    var GateChannelNode = (function() {
        function GateChannelNode(parent) {
            T.Object.call(this, 2, []);
            fn.fixAR(this);
            this._.parent = parent;
        }
        fn.extend(GateChannelNode);

        GateChannelNode.prototype.process = function(tickID) {
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                this._.parent.process(tickID);
            }
            return this;
        };

        return GateChannelNode;
    })();

    function GateNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        this._.selected = 0;
        this._.outputs  = [];
    }
    fn.extend(GateNode);

    var $ = GateNode.prototype;

    Object.defineProperties($, {
        selected: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.selected = value;
                    var outputs = _.outputs;
                    for (var i = 0, imax = outputs.length; i < imax; ++i) {
                        if (outputs[i]) {
                            outputs[i].cells[0].set(fn.emptycell);
                            outputs[i].cells[1].set(fn.emptycell);
                            outputs[i].cells[2].set(fn.emptycell);
                        }
                    }
                }
            },
            get: function() {
                return this._.selected;
            }
        }
    });

    $.at = function(index) {
        var _ = this._;
        var output = _.outputs[index];
        if (!output) {
            _.outputs[index] = output = new GateChannelNode(this);
        }
        return output;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var output = _.outputs[_.selected];
            if (output) {
                output.cells[0].set(this.cells[0]);
                output.cells[1].set(this.cells[1]);
                output.cells[2].set(this.cells[2]);
            }
        }

        return this;
    };

    fn.register("gate", GateNode);

})(timbre);
