(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.utils.timevalue;
    
    function FNoise(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.samplerate = timbre.samplerate;
        _.reg = 0x8000;
        _.shortFlag = false;
        _.phase     = 0;
        _.lastValue = 0;
        
        this.once("init", oninit);
    }
    fn.extend(FNoise);
    
    var oninit = function() {
        var _ = this._;
        if (!_.freq) {
            this.freq = 440;
        }
    };
    
    var $ = FNoise.prototype;
    
    Object.defineProperties($, {
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        return;
                    }
                    value = 1000 / value;
                }
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        shortFlag: {
            set: function(value) {
                this._.shortFlag = !!value;
            },
            get: function() {
                return this._.shortFlag;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var lastValue = _.lastValue;
            var phase     = _.phase;
            var phaseStep = _.freq.process(tickID)[0] / _.samplerate;
            var reg = _.reg;
            var mul = _.mul, add = _.add;
            var i, imax;
            
            if (_.shortFlag) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    if (phase >= 1) {
                        reg >>= 1;
                        reg |= ((reg ^ (reg >> 6)) & 1) << 15;
                        lastValue = ((reg & 1) - 0.5);
                        phase -= 1;
                    }
                    cell[i] = lastValue * mul + add;
                    phase += phaseStep;
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    if (phase >= 1) {
                        reg >>= 1;
                        reg |= ((reg ^ (reg >> 1)) & 1) << 15;
                        lastValue = ((reg & 1) - 0.5);
                        phase -= 1;
                    }
                    cell[i] = lastValue * mul + add;
                    phase += phaseStep;
                }
            }
            _.reg       = reg;
            _.phase     = phase;
            _.lastValue = lastValue;
        }
        
        return cell;
    };
    
    fn.register("fnoise", FNoise);
})();
