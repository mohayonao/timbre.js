(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function PannerNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.value = T(0);
        _.panL = 0.5;
        _.panR = 0.5;
    }
    fn.extend(PannerNode);
    
    var $ = PannerNode.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                this._.value = T(value);
            },
            get: function() {
                return this._.value;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var changed = false;
            
            var value = _.value.process(tickID).cells[0][0];
            if (_.prevValue !== value) {
                _.prevValue = value;
                changed = true;
            }
            if (changed) {
                _.panL = Math.cos(0.5 * Math.PI * ((value * 0.5) + 0.5));
                _.panR = Math.sin(0.5 * Math.PI * ((value * 0.5) + 0.5));
            }
            
            var nodes = this.nodes;
            var cell  = this.cells[0];
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cellL.length;
            var mul = _.mul, add = _.add;
            var tmp, x;
            
            for (j = 0; j < jmax; ++j) {
                cell[i] = cellL[j] = cellR[j] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = nodes[i].process(tickID).cells[0];
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellR[j] = (cell[j] += tmp[j]);
                }
            }
            
            var panL = _.panL;
            var panR = _.panR;
            for (j = 0; j < jmax; ++j) {
                x  = cellL[j] = cellL[j] * panL * mul + add;
                x += cellR[j] = cellR[j] * panR * mul + add;
                cell[j] = x * 0.5;
            }
        }
        
        return this;
    };
    
    fn.register("pan", PannerNode);
    
})(timbre);
