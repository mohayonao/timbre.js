(function(T) {
    "use strict";

    var fn = T.fn;

    function SelectorNode(_args) {
        T.Object.call(this, _args);
        
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
                    for (var i = cell.length; i--; ) {
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

            var inputs = this.inputs;
            var i, imax = inputs.length;
            
            if (_.background) {
                for (i = 0; i < imax; ++i) {
                    inputs[i].process(tickID);
                }
            }
            
            var tmp = inputs[_.selected];
            if (tmp) {
                cell.set(tmp.process(tickID));
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("selector", SelectorNode);
    
})(timbre);
