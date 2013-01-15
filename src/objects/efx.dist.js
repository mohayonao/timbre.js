(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function EfxDistNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        this.attrs[ATTRS_PRE]  = timbre(-60);
        this.attrs[ATTRS_POST] = timbre( 18);
        
        var _ = this._;
        _.samplerate = timbre.samplerate;
        _.x1 = _.x2 = _.y1 = _.y2 = 0;
        _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        _.cutoff = 0;
    }
    fn.extend(EfxDistNode);
    
    var $ = EfxDistNode.prototype;
    
    var ATTRS_PRE  = fn.setAttrs($, ["pre", "preGain"]);
    var ATTRS_POST = fn.setAttrs($, ["post", "postGain"]);
    
    Object.defineProperties($, {
        cutoff: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.cutoff = value;
                }
            },
            get: function() {
                return this._.cutoff;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;

            var preGain = this.attrs[ATTRS_PRE].process(tickID)[0];
            if (_.prevPreGain !== preGain) {
                _.prevPreGain = preGain;
                changed = true;
            }
            var postGain = this.attrs[ATTRS_POST].process(tickID)[0];
            if (_.prevPostGain !== postGain) {
                _.prevPostGain = postGain;
                changed = true;
            }
            if (changed) {
                var postScale = Math.pow(2, -postGain * 0.166666666);
                _.preScale = Math.pow(2, -preGain * 0.166666666) * postScale;
                _.limit = postScale;
            }
            
            var preScale = _.preScale;
            var limit    = _.limit;
            var mul = _.mul, add = _.add;
            var i, imax;
            var x0, y0;
            
            if (_.cutoff) {
                if (_.prevCutoff !== _.cutoff) {
                    _.prevCutoff = _.cutoff;
                    lowpass_params(_);
                }
                
                var x1 = _.x1;
                var x2 = _.x2;
                var y1 = _.y1;
                var y2 = _.y2;
                
                var b0 = _.b0;
                var b1 = _.b1;
                var b2 = _.b2;
                var a1 = _.a1;
                var a2 = _.a2;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x0 = cell[i] * preScale;
                    y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                    
                    y0 = (y0 > limit) ? limit : (y0 < -limit) ? -limit : y0;
                    
                    cell[i] = y0 * mul + add;
                    
                    x2 = x1;
                    x1 = x0;
                    y2 = y1;
                    y1 = y0;
                }
                
                // flushDenormalFloatToZero
                if ((x1 > 0 && x1 <  1e-4) || (x1 < 0 && x1 > -1e-4)) {
                    x1 = 0;
                }
                if ((y1 > 0 && y1 <  1e-4) || (y1 < 0 && y1 > -1e-4)) {
                    y1 = 0;
                }
                
                _.x1 = x1;
                _.x2 = x2;
                _.y1 = y1;
                _.y2 = y2;
            } else {
                for (i = cell.length; i--; ) {
                    x0 = cell[i] * preScale;
                    x0 = (x0 > limit) ? limit : (x0 < -limit) ? -limit : x0;
                    cell[i] = x0 * mul + add;
                }
            }
        }
        
        return cell;
    };

    var lowpass_params = function(_) {
        var cutoff = _.cutoff / (_.samplerate * 0.5);
        
        if (cutoff >= 1) {
            _.b0 = 1;
            _.b1 = _.b2 = _.a1 = _.a2 = 0;
        } else if (cutoff <= 0) {
            _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        } else {
            var resonance = 1;
            var g = Math.pow(10.0, 0.05 * resonance);
            var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) * 0.5);
            
            var theta = Math.PI * cutoff;
            var sn = 0.5 * d * Math.sin(theta);
            var beta = 0.5 * (1 - sn) / (1 + sn);
            var gamma = (0.5 + beta) * Math.cos(theta);
            var alpha = 0.25 * (0.5 + beta - gamma);
            
            _.b0 = 2 * alpha;
            _.b1 = 4 * alpha;
            _.b2 = _.b0;
            _.a1 = 2 * -gamma;
            _.a2 = 2 * beta;
        }
    };
    
    fn.register("efx.dist", EfxDistNode);
    
})();
