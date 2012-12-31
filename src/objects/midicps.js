(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function MidiCpsNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.index = 0;
        _.value = 0;
        _.prev  = null;
        _.a4    = 440;
    }
    fn.extend(MidiCpsNode);
    
    var $ = MidiCpsNode.prototype;
    
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
        a4: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.a4   = value;
                    this._.prev = null;
                }
            },
            get: function() {
                return this._.a4;
            }
        }
    });
    
    $.at = function(index) {
        var _ = this._;
        return _.a4 * Math.pow(2, (index - 69) / 12);
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var index = (this.inputs.length) ? fn.inputSignalKR(this) : _.index;
            
            if (_.prev !== index) {
                _.prev = index;
                _.value = _.a4 * Math.pow(2, (index - 69) / 12);
            }
            
            var value = _.value * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("midicps", MidiCpsNode);
    
})(timbre);
