(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function MidiRatioNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.midi = 0;
        _.value = 0;
        _.prev  = null;
        _.range = 12;
    }
    fn.extend(MidiRatioNode);
    
    var $ = MidiRatioNode.prototype;
    
    Object.defineProperties($, {
        midi: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.midi = value;
                }
            },
            get: function() {
                return this._.midi;
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
    
    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };
    
    $.at = function(midi) {
        var _ = this._;
        return Math.pow(2, midi / _.range);
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var midi = (this.inputs.length) ? fn.inputSignalKR(this) : _.midi;
            
            if (_.prev !== midi) {
                _.prev = midi;
                _.value = Math.pow(2, midi / _.range);
            }
            
            var value = _.value * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("midiratio", MidiRatioNode);
    
})();
