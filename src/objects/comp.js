(function(T) {
    "use strict";
    
    var fn = T.fn;
    var timevalue  = T.timevalue;
    var Compressor = T.modules.Compressor;
    
    function CompressorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.prevThresh = -24;
        _.prevKnee   =  30;
        _.prevRatio  =  12;
        _.thresh = T(_.prevThresh);
        _.knee   = T(_.prevKnee);
        _.ratio  = T(_.prevRatio);
        _.postGain  =   6;
        _.reduction =   0;
        
        _.comp = new Compressor(T.samplerate, 2);
        _.comp.dbPostGain  = _.postGain;
        _.comp.setAttackTime(0.003);
        _.comp.setReleaseTime(0.25);
        _.comp.setPreDelayTime(6);
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
                _.comp.process(this.cells[1], this.cells[2]);
                _.reduction = _.comp.meteringGain;
            }
            
            fn.outputSignalAR(this);
        }
        
        return this;
    };
    
    var super_plot = T.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (true) {
            var comp = this._.comp.clone();
            comp.setParams(this.thresh.valueOf(), this.knee.valueOf(), this.ratio.valueOf());
            
            var cell = new fn.SignalArray(1024);
            var data = new Float32Array(128);
            var db, maxdb;
            var i, j;
            for (i = 0; i < 128; ++i) {
                db = Math.pow(10, (i * 0.625 - 80) * 0.05);
                for (j = 0; j < 1024; ++j) {
                    cell[j] = db;
                }
                comp.process(cell, cell);
                maxdb = 0;
                for (j = 0; j < 32; ++j) {
                    if (Math.abs(cell[j]) > maxdb) {
                        maxdb = Math.abs(cell[j]);
                    }
                }
                if (maxdb < 1e-6) {
                    maxdb = 1e-6;
                }
                maxdb = (Math.log(maxdb) * Math.LOG10E * 20);
                maxdb = 80 + maxdb;
                data[i] = maxdb;
            }
            this._.plotData = data;
            this._.plotRange = [0, 80];
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("comp", CompressorNode);
    fn.alias("compressor", "comp");
    
})(timbre);
