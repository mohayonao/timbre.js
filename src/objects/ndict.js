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
    
    var NDictKey = {
        90 : 48, // Z -> C3
        83 : 49, // S -> C+3
        88 : 50, // X -> D3
        68 : 51, // D -> D+3
        67 : 52, // C -> E3
        86 : 53, // V -> F3
        71 : 54, // G -> F+3
        66 : 55, // B -> G3
        72 : 56, // H -> G+3
        78 : 57, // N -> A3
        74 : 58, // J -> A+3
        77 : 59, // M -> B3
        188: 60, // , -> C4
        76 : 61, // L -> C+4
        190: 62, // . -> D4
        186: 63, // ; -> D+4

        81 : 60, // Q -> C4
        50 : 61, // 2 -> C+4
        87 : 62, // W -> D4
        51 : 63, // 3 -> D+4
        69 : 64, // E -> E4
        82 : 65, // R -> F4
        53 : 66, // 5 -> F+4
        84 : 67, // T -> G4
        54 : 68, // 6 -> G+4
        89 : 69, // Y -> A4
        55 : 70, // 7 -> A+4
        85 : 71, // U -> B4
        73 : 72, // I -> C5
        57 : 73, // 9 -> C#5
        79 : 74, // O -> D5
        48 : 75, // 0 -> D+5
        80 : 76  // P -> E5
    };
    
    fn.register("ndict.key", function(_args) {
        var instance = new NDictNode(_args);
        instance.dict = NDictKey;
        return instance;
    });
    
})(timbre);

