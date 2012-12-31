(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function NDictNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        var _ = this._;
        _.defaultValue = 0;
        _.index = 0;
        _.dict  = {};
    }
    fn.extend(NDictNode);
    
    var $ = NDictNode.prototype;
    
    Object.defineProperties($, {
            dict: {
            set: function(value) {
                if (typeof value === "object") {
                    this._.dict = value;
                } else if (typeof value === "function") {
                    var dict = {};
                    for (var i = 0; i < 128; ++i) {
                        dict[i] = value(i);
                    }
                    this._.dict = dict;
                }
            },
            get: function() {
                return this._.dict;
            }
        },
        defaultValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.defaultValue = value;
                }
            },
            get: function() {
                return this._.defaultValue;
            }
        },
        index: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.index = value;
                }
            },
            get: function() {
                return this._.index;
            }
        }
    });
    
    $.at = function(index) {
        var _ = this._;
        return (_.dict[index|0] || _.defaultValue) * _.mul + _.add;
    };
    
    $.clear = function() {
        this._.dict = {};
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var index = (this.inputs.length) ? fn.inputSignalKR(this) : _.index;
            
            if (index < 0) {
                index = (index - 0.5)|0;
            } else {
                index = (index + 0.5)|0;
            }
            var value = (_.dict[index] || _.defaultValue) * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("ndict", NDictNode);
    
})(timbre);

