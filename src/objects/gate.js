(function(T) {
    "use strict";
    
    var fn = T.fn;
    var ChannelObject = T.ChannelObject;
    
    function GateNode(_args) {
        T.Object.call(this, 1, _args);
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
                            outputs[i].cell.set(fn.emptycell);
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
            _.outputs[index] = output = new ChannelObject(this);
        }
        return output;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            fn.outputSignalAR(this);
            
            if (_.outputs[_.selected]) {
                _.outputs[_.selected].cell.set(this.cells[0]);
            }
        }
        
        return this;
    };
    
    fn.register("gate", GateNode);
    
})(timbre);
