(function(T) {
    "use strict";
    
    var fn = T.fn;
    var timevalue  = T.timevalue;
    var Compressor = T.modules.Compressor;
    
    function CompressorNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.thresh = T(-24);
        _.knee   = T(30);
        _.ratio  = T(12);
        _.postGain  =   6;
        _.reduction =   0;
        
        _.comp = new Compressor(T.samplerate);
        _.comp.dbPostGain  = _.postGain;
        _.comp.setAttackTime(0.003);
        _.comp.setReleaseTime(0.25);
    }
    fn.extend(CompressorNode);
    
    var $ = CompressorNode.prototype;
    
    Object.defineProperties($, {
        thresh: {
            set: function(value) {
                this._.thresh = T(value);
            },
            get: function() {
                return this._.thresh;
            }
        },
        knee: {
            set: function(value) {
                this._.kne = T(value);
            },
            get: function() {
                return this._.knee;
            }
        },
        ratio: {
            set: function(value) {
                this._.ratio = T(value);
            },
            get: function() {
                return this._.ratio;
            }
        },
        gain: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.postGain = value;
                    this._.comp.dbPostGain = value;
                }
            },
            get: function() {
                return this._.postGain;
            }
        },
        attack: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.attack = value;
                    this._.comp.setAttackTime(value * 0.001);
                }
            },
            get: function() {
                return this._.comp.attackTime;
            }
        },
        release: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    }
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.release = value;
                    this._.comp.releaseTime = value * 0.001;
                }
            },
            get: function() {
                return this._.release;
            }
        },
        reduction: {
            get: function() {
                return this._.reduction;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cells[0];
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var thresh = _.thresh.process(tickID).cells[0][0];
            var knee   = _.knee.process(tickID).cells[0][0];
            var ratio  = _.ratio.process(tickID).cells[0][0];
            if (_.prevThresh !== thresh || _.prevKnee !== knee || _.prevRatio !== ratio) {
                _.prevThresh = thresh;
                _.prevKnee   = knee;
                _.prevRatio  = ratio;
                _.comp.setParams(thresh, knee, ratio);
            }
            
            if (!_.bypassed) {
                _.comp.process(cell);
                _.reduction = _.comp.meteringGain;
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    fn.register("comp", CompressorNode);
    fn.alias("compressor", "comp");
    
})(timbre);
