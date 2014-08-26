(function(T) {
    "use strict";

    var fn = T.fn;
    var modules = T.modules;

    fn.register("audio", function(_args) {
        var BufferNode = fn.getClass("buffer");
        var instance = new BufferNode(_args);

        instance.playbackState = fn.FINISHED_STATE;
        instance._.isLoaded = false;

        Object.defineProperties(instance, {
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            }
        });

        instance.load     = load;
        instance.loadthis = loadthis;

        return instance;
    });

    var load = function(src) {
        var self = this, _ = this._;
        var dfd = new modules.Deferred(this);

        var args = arguments, i = 1;

        dfd.done(function() {
            self._.emit("done");
        });

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
                self.playbackState = fn.PLAYING_STATE;
                _.samplerate = result.samplerate;
                _.channels   = result.channels;
                _.bufferMix  = null;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / T.samplerate;
                _.duration   = result.duration * 1000;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer[0].length + _.phaseIncr;
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

    var loadthis = function() {
        load.apply(this, arguments);
        return this;
    };

})(timbre);
