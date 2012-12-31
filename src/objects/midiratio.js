(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function MidiRatioNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.index = 0;
        _.value = 0;
        _.prev  = null;
        _.range = 12;
    }
    fn.extend(MidiRatioNode);
    
    var $ = MidiRatioNode.prototype;
    
    Object.defineProperties($, {
        index: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.index = value;
                }
            },
            get: function() {
                return this._.index;
            }
        },
        range: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.range = value;
                }
            },
            get: function() {
                return this._.range;
            }
        }
    });
    
    $.at = function(index) {
        var _ = this._;
        return Math.pow(2, index / _.range);
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var index = (this.inputs.length) ? fn.inputSignalKR(this) : _.index;
            
            if (_.prev !== index) {
                _.prev = index;
                _.value = Math.pow(2, index / _.range);
            }
            
            var value = _.value * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("midiratio", MidiRatioNode);
    
})(timbre);
