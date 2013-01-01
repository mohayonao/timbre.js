(function(timbre) {
    "use strict";

    var fn = timbre.fn;
    
    function PluckGen(_args) {
        timbre.GenObject.call(this, _args);
        
        this._.synthdef = synthdef.bind(this);
    }
    fn.extend(PluckGen, timbre.GenObject);
    
    var synthdef = function(opts) {
        var _ = this._, synth;
        
        synth = timbre("pluck", {freq:opts.freq, mul:opts.amp}).bang();
        synth = timbre(_.env.type, _.env, synth);
        synth.on("ended", function() {
            _.remGen(this);
        }).bang();
        
        return synth;
    };
    
    fn.register("PluckGen", PluckGen);
    
})(timbre);
