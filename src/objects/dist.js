(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function DistNode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pre  = T( 60);
        _.post = T(-18);
        _.samplerate = T.samplerate;
        _.x1 = _.x2 = _.y1 = _.y2 = 0;
        _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        _.cutoff = 0;
    }
    fn.extend(DistNode);
    
    var $ = DistNode.prototype;
    
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
        },
        pre: {
            set: function(value) {
                this._.pre = T(value);
            },
            get: function() {
                return this._.pre;
            }
        },
        post: {
            set: function(value) {
                this._.post = T(value);
            },
            get: function() {
                return this._.post;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var preGain  = -_.pre.process(tickID)[0];
            var postGain = -_.post.process(tickID)[0];

            if (_.prevPreGain !== preGain || _.prevPostGain !== postGain) {
                _.prevPreGain  = preGain;
                _.prevPostGain = postGain;
                var postScale = Math.pow(2, -postGain * 0.166666666);
                _.preScale = Math.pow(2, -preGain * 0.166666666) * postScale;
                _.limit = postScale;
            }
            
            if (!_.bypassed) {
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
                    
                    var x1 = _.x1, x2 = _.x2, y1 = _.y1, y2 = _.y2;
                    var b0 = _.b0, b1 = _.b1, b2 = _.b2, a1 = _.a1, a2 = _.a2;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        x0 = cell[i] * preScale;
                        y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                        
                        y0 = (y0 > limit) ? limit : (y0 < -limit) ? -limit : y0;
                        
                        cell[i] = y0 * mul + add;
                        
                        x2 = x1; x1 = x0; y2 = y1; y1 = y0;
                    }
                    
                    // flushDenormalFloatToZero
                    if ((x1 > 0 && x1 <  1e-4) || (x1 < 0 && x1 > -1e-4)) {
                        x1 = 0;
                    }
                    if ((y1 > 0 && y1 <  1e-4) || (y1 < 0 && y1 > -1e-4)) {
                        y1 = 0;
                    }
                    
                    _.x1 = x1; _.x2 = x2; _.y1 = y1; _.y2 = y2;
                } else {
                    for (i = cell.length; i--; ) {
                        x0 = cell[i] * preScale;
                        x0 = (x0 > limit) ? limit : (x0 < -limit) ? -limit : x0;
                        cell[i] = x0 * mul + add;
                    }
                }
            } else {
                fn.outputSignalAR(this);
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

    fn.register("distortion", DistNode);
    fn.alias("dist", "distortion");
    
})(timbre);
