(function(T) {
    "use strict";
    
    var fn = T.fn;
    var Compressor = T.modules.Compressor;
    
    function CompressorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.prevThresh = -24;
        _.prevKnee   =   0; // not implemented
        _.prevRatio  =  12;
        _.thresh = T(_.prevThresh);
        _.knee   = 0; // T(_.prevKnee);
        _.ratio  = T(_.prevRatio);
        
        _.comp = new Compressor(_.samplerate);
        _.comp.setParams(_.prevThresh, _.prevKnee, _.prevRatio);
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
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var thresh = _.thresh.process(tickID).cells[0][0];
            var knee   = 0; // _.knee.process(tickID).cells[0][0];
            var ratio  = _.ratio.process(tickID).cells[0][0];
            if (_.prevThresh !== thresh || _.prevKnee !== knee || _.prevRatio !== ratio) {
                _.prevThresh = thresh;
                _.prevKnee   = knee;
                _.prevRatio  = ratio;
                _.comp.setParams(thresh, knee, ratio);
            }
            
            if (!_.bypassed) {
                _.comp.process(this.cells[1], this.cells[2]);
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    fn.register("comp", CompressorNode);
    
})(timbre);
