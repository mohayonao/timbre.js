(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function OscGen(_args) {
        timbre.GenObject.call(this, _args);
        
        this._.wave = "sin";
        this._.synthdef = synthdef.bind(this);
    }
    fn.extend(OscGen, timbre.GenObject);
    
    var $ = OscGen.prototype;

    Object.defineProperties($, {
        wave: {
            set: function(value) {
                if (typeof value === "string") {
                    this._.wave = value;
                }
            },
            get: function() {
                return this._.wave;
            }
        }
    });
    
    var synthdef = function(opts) {
        var _ = this._, synth;
        
        synth = timbre("osc", {wave:_.wave, freq:opts.freq, mul:opts.amp});
        synth = timbre(_.env.type, _.env, synth);
        synth.on("ended", function() {
            _.remGen(this);
        }).bang();
        
        return synth;
    };
    
    fn.register("OscGen", OscGen);
    
})(timbre);
