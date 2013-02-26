(function(T) {
    "use strict";
    
    if (T.envtype !== "browser") {
        return;
    }
    
    var fn = T.fn;
    var modules = T.modules;

    fn.register("audio.jsonp", function(_args) {
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

    var re = /(_)?callback=([_\w\d]+)/;
    
    var load = function(url) {
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
        
        var m, callback, script;
        
        if (_.script) {
            dfd.reject();
        } else {
            m = re.exec(url);
            callback = "timbrejs_audiojsonp";
            if (m) {
                if (m[1]) {
                    url = url.replace(m[0], "");
                    url = url.replace(/\?$/, "");
                }
                callback += "_" + m[2] + "";
            }
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
            
            window[callback] = function(base64, ext) {
                var bin = atob(base64);
                var a = new Array(bin.length), i, imax;
                for (i = 0, imax = a.length; i < imax; ++i) {
                    a[i] = bin.charCodeAt(i);
                }
                var src = { type:ext, data:new Uint8Array(a) };
                new modules.Decoder().decode(src, onloadedmetadata, onloadeddata);
                
                delete window[callback];
                _.script = null;
            };
            script = document.createElement("script");
            script.src = url;
            document.body.appendChild(script);
            _.script = script;
        }
        
        return dfd.promise();
    };
    
    var loadthis = function() {
        load.apply(this, arguments);
        return this;
    };
    
})(timbre);
