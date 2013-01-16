(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Oscillator = timbre.modules.Oscillator;
    
    function COscNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this.attrs[ATTRS_FREQ] = timbre(440);
        
        var _ = this._;
        _.osc1 = new Oscillator(timbre.samplerate);
        _.osc2 = new Oscillator(timbre.samplerate);
        _.osc1.step = this.cell.length;
        _.osc2.step = this.cell.length;
        _.tmp = new Float32Array(this.cell.length);
        _.beats = 0.5;
        
        this.once("init", oninit);
    }
    fn.extend(COscNode);
    
    var oninit = function() {
        if (!this.wave) {
            this.wave = "sin";
        }
    };
    
    var $ = COscNode.prototype;
    
    var ATTRS_FREQ = fn.setAttrs($, ["freq", "frequency"]);
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc1.setWave(value);
                this._.osc2.setWave(value);
            },
            get: function() {
                return this._.osc1.wave;
            }
        },
        beats: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.beats = value;
                }
            },
            get: function() {
                return this._.beats;
            }
        }
    });
    
    $.bang = function() {
        this._.osc1.reset();
        this._.osc2.reset();
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var i, imax = cell.length;
            var freq = this.attrs[ATTRS_FREQ].process(tickID)[0];
            var osc1 = _.osc1, osc2 = _.osc2, tmp = _.tmp;
            
            osc1.frequency = freq - (_.beats * 0.5);
            osc1.process(tmp);
            for (i = imax; i--; ) {
                cell[i] = tmp[i] * 0.5;
            }
            
            osc2.frequency = freq + (_.beats * 0.5);
            osc2.process(tmp);
            for (i = imax; i--; ) {
                cell[i] += tmp[i] * 0.5;
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("cosc", COscNode);
    
})();
