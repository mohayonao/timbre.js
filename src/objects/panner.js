(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function PannerNode(_args) {
        timbre.Object.call(this, _args);
        fn.stereo(this);
        fn.fixAR(this);
        
        this._.panL = 0.5;
        this._.panR = 0.5;
        
        this.once("init", oninit);
    }
    fn.extend(PannerNode);
    
    var oninit = function() {
        if (!this._.value) {
            this.value = 0;
        }
    };
    
    var $ = PannerNode.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                this._.value = timbre(value);
            },
            get: function() {
                return this._.value;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var changed = false;
            
            var value = _.value.process(tickID)[0];
            if (_.prevValue !== value) {
                _.prevValue = value;
                changed = true;
            }
            if (changed) {
                _.panL = Math.cos(0.5 * Math.PI * ((value * 0.5) + 0.5));
                _.panR = Math.sin(0.5 * Math.PI * ((value * 0.5) + 0.5));
            }
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp, x;
            
            var cellL = this.cellL;
            var cellR = this.cellR;
            
            for (j = jmax; j--; ) {
                cellL[j] = cellR[j] = cell[j] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].process(tickID);
                for (j = jmax; j--; ) {
                    cellL[j] = cellR[j] = cell[j] += tmp[j];
                }
            }
            
            var panL = _.panL;
            var panR = _.panR;
            for (j = jmax; j--; ) {
                x  = cellL[j] = cellL[j] * panL * mul + add;
                x += cellR[j] = cellR[j] * panR * mul + add;
                cell[j] = x * 0.5;
            }
        }
        
        return cell;
    };
    
    fn.register("pan", PannerNode);
    
})(timbre);
