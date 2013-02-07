(function(T) {
    "use strict";

    var fn = T.fn;

    function SelectorNode(_args) {
        T.Object.call(this, 1, _args);
        
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
                    var cell = this.cell;
                    for (var i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = 0;
                    }
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
        var cell = this.cell;
        
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
                cell.set(tmp.process(tickID).getChannelData(0));
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    fn.register("selector", SelectorNode);
    
})(timbre);
