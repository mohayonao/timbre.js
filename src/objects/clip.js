(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function ClipNode(_args) {
        T.Object.call(this, _args);
        
        var _ = this._;
        _.min = -0.8;
        _.max = +0.8;
    }
    fn.extend(ClipNode);
    
    var $ = ClipNode.prototype;
    
    Object.defineProperties($, {
        minmax: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.min = -Math.abs(value);
                    _.max = -_.min;
                }
            },
            get: function() {
                return this._.max;
            }
        },
        min: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (_.max < value) {
                        _.max = value;
                    } else {
                        _.min = value;
                    }
                }
            },
            get: function() {
                return this._.min;
            }
        },
        max: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (value < _.min) {
                        _.min = value;
                    } else {
                        _.max = value;
                    }
                }
            },
            get: function() {
                return this._.max;
            }
        }
    });
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var nodes = this.nodes;
            var mul = _.mul, add = _.add;
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var min = _.min, max = _.max;
            var tmp, x;
            
            for (j = 0; j < jmax; ++j) {
                cell[j] = 0;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = nodes[i].process(tickID);
                    for (j = 0; j < jmax; ++j) {
                        cell[j] += tmp[j];
                    }
                }
                for (j = 0; j < jmax; ++j) {
                    x = cell[j];
                    x = (x < min) ? min : (x > max) ? max : x;
                    cell[j] = x;
                }
                
                if (mul !== 1 || add !== 0) {
                    for (j = 0; j < jmax; ++j) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {    // control-rate
                tmp = 0;
                for (i = 0; i < imax; ++i) {
                    tmp += nodes[i].process(tickID)[0];
                }
                tmp = (tmp < min) ? min : (tmp > max) ? max : tmp;
                tmp = tmp * mul + add;
                for (j = 0; j < jmax; ++j) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    fn.register("clip", ClipNode);
    
})(timbre);
