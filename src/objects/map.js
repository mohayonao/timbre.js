(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function MapNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.input  = 0;
        _.output = 0;
        _.prev   = null;
        _.map    = defaultFunction;
    }
    fn.extend(MapNode);
    
    var defaultFunction = function(x) {
        return x;
    };
    
    var $ = MapNode.prototype;
    
    Object.defineProperties($, {
        input: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.input = value;
                }
            },
            get: function() {
                return this._.input;
            }
        },
        map: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.map = value;
                }
            },
            get: function() {
                return this._.map;
            }
        }
    });

    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };
    
    $.at = function(input) {
        return (this._.map) ? this._.map(input) : 0;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var input = (this.inputs.length) ? fn.inputSignalKR(this) : _.input;
            
            if (_.map && _.prev !== input) {
                _.prev = input;
                _.output = _.map(input);
            }
            
            var output = _.output * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = output;
            }
        }
        
        return cell;
    };
    
    fn.register("map", MapNode);
    
})(timbre);
