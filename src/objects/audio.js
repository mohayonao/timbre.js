(function() {
    "use strict";

    var fn = timbre.fn;
    var modules = timbre.modules;
    
    fn.register("audio", function(_args) {
        var instance = timbre.apply(null, ["buffer"].concat(_args));
        
        instance._.isLoaded = false;
        instance._.isEnded  = true;
        
        Object.defineProperties(instance, {
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            }
        });
        
        instance.load = load;
        
        return instance;
    });
    
    var load = function(src) {
        var self = this, _ = this._;
        var dfd = new modules.Deferred();

        var args = arguments, i = 1;
        
        dfd.done(function() {
            this._.emit("done");
        }.bind(this));
        
        if (typeof args[i] === "function") {
            dfd.done(args[i++]);
            if (typeof args[i] === "function") {
                dfd.fail(args[i++]);
            }
        }
        
        _.loadedTime = 0;
        
        var onloadedmetadata = function(result, msg) {
            var _ = self._;
            if (result) {
                _.samplerate = result.samplerate;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / timbre.samplerate;
                _.duration   = result.duration * 1000;
                _.isEnded    = false;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer.length + _.phaseIncr;
                }
                self._.emit("loadedmetadata");
            } else {
                dfd.reject(msg);
            }
        };
        
        var onloadeddata = function() {
            self._.isLoaded  = true;
            self._.plotFlush = true;
            self._.emit("loadeddata");
            dfd.resolveWith(self);
        };
        
        new modules.Decoder().decode(src, onloadedmetadata, onloadeddata);
        
        return dfd.promise();
    };
    
})();
