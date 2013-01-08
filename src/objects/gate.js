(function() {
    "use strict";
    
    var fn = timbre.fn;
    var ChannelObject = timbre.ChannelObject;
    var empty;
    
    function GateNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this._.selected = 0;
        this._.outputs  = [];
        
        empty = new Float32Array(this.cell.length);
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
                    for (var i = outputs.length; i--; ) {
                        if (outputs[i]) {
                            outputs[i].cell.set(empty);
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
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);
            
            if (_.outputs[_.selected]) {
                _.outputs[_.selected].cell.set(this.cell);
            }
        }
        
        return cell;
    };
    
    fn.register("gate", GateNode);
    
})();
