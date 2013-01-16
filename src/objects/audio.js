(function() {
    "use strict";

    var fn = timbre.fn;
    var modules = timbre.modules;
    
    fn.register("audio", function(_args) {
        var instance = timbre.apply(null, ["buffer"].concat(_args));
        
        instance._.isLoaded = false;
        instance._.isEnded  = true;
        instance._.loadedTime  = 0;
        
        Object.defineProperties(instance, {
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            },
            loadedTime: {
                get: function() {
                    return this._.loadedTime;
                }
            }
        });
        
        instance.load = load;
        
        return instance;
    });
    
    
    var load = (function() {
        if (timbre.envtype === "browser") {
            return getLoadFunctionForBrowser();
        } else if (timbre.envtype === "node") {
            return getLoadFunctionForNodeJS();
        } else {
            return function() {
                return new modules.Deferred().reject().promise();
            };
        }
    })();
    
    
    function getLoadFunctionForBrowser() {
        return function() {
            var _ = this._;
            var dfd = new modules.Deferred();
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            } else if (args[i] instanceof File) {
                _.src = args[i++];
            }
            if (!_.src) {
                return dfd.reject().promise();
            }
            
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
            
            var src = _.src;
            var decoderList;
            
            if (typeof src === "string") {
                if (src !== "") {
                    if (/.*\.wav/.test(src)) {
                        decoderList = [wav_decoder];
                    } else {
                        if (webkit_decoder) {
                            decoderList = [webkit_decoder];
                        } else if (moz_decoder) {
                            decoderList = [moz_decoder];
                        }
                    }
                    then.call(this, decoderList, src, dfd);
                    this._.emit("load");
                } else {
                    dfd.reject();
                }
            } else {
                if (webkit_decoder) {
                    decoderList = [webkit_decoder];
                    then.call(this, decoderList, src, dfd);
                    this._.emit("load");
                } else {
                    var msg = "no support";
                    this._.emit("error", msg);
                    dfd.reject();
                }
            }
            return dfd.promise();
        };
    }
    
    
    function getLoadFunctionForNodeJS() {
        return function() {
            var fs = require("fs");
            var self = this, _ = this._;
            var dfd = new modules.Deferred();
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            }
            if (!_.src) {
                return dfd.reject().promise();
            }
            
            if (typeof args[i] === "function") {
                dfd.done(args[i++]);
                if (typeof args[i] === "function") {
                    dfd.fail(args[i++]);
                }
            }
            
            _.loadedTime = 0;
            
            var src = _.src;
            
            if (typeof src === "string") {
                fs.exists(src, function(exists) {
                    if (!exists) {
                        var msg = "file does not exists";
                        self._.emit("error", msg);
                        dfd.reject();
                    }
                    
                    if (/.*\.ogg/.test(src)) {
                        then.call(self, [node_ogg_decoder], src, dfd);
                    } else if (/.*\.mp3/.test(src)) {
                        then.call(self, [node_mp3_decoder], src, dfd);
                    } else if (/.*\.wav/.test(src)) {
                        then.call(self, [wav_decoder], src, dfd);
                    }
                });
                this._.emit("load");
            }
            return dfd.promise();
        };
    }
    
    var then = function(decoderList, data, dfd) {
        var self = this;
        
        // TODO:
        if (!decoderList) {
            return dfd.reject();
        }
        
        var onloadedmetadata = function(result) {
            var _ = self._;
            if (result) {
                _.samplerate = result.samplerate;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / timbre.samplerate;
                _.duration   = result.duration * 1000;
                _.loadedTime = _.duration;
                _.isEnded    = false;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer.length + _.phaseIncr;
                }
                self._.emit("loadedmetadata");
            } else {
                iter();
            }
        };
        
        var onloadeddata = function() {
            self._.isLoaded  = true;
            self._.plotFlush = true;
            self._.emit("loadeddata");
            dfd.resolveWith(self);
        };
        
        var iter = function() {
            if (decoderList.length > 0) {
                var decoder = decoderList.shift();
                if (decoder) {
                    decoder(data, onloadedmetadata, onloadeddata);
                } else {
                    iter();
                }
            } else {
                self._.emit("error", "can't decode");
                dfd.reject();
            }
        };
        iter();
    };
    
    var webkit_decoder = (function() {
        if (typeof webkitAudioContext !== "undefined") {
            return function(data, onloadedmetadata, onloadeddata) {
                var decoder = new modules.Decoder();
                decoder.decode("webkit", data, onloadedmetadata, onloadeddata);
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(data, onloadedmetadata, onloadeddata) {
                var decoder = new modules.Decoder();
                decoder.decode("moz", data, onloadedmetadata, onloadeddata);
            };
        }
    })();
    
    var wav_decoder = function(data, onloadedmetadata, onloadeddata) {
        var decoder = new modules.Decoder();
        decoder.decode("wav", data, onloadedmetadata, onloadeddata);
    };
    
    var node_ogg_decoder = function(filepath, onloadedmetadata, onloadeddata) {
        var decoder = new modules.Decoder();
        decoder.decode("ogg", filepath, onloadedmetadata, onloadeddata);
    };
    
    var node_mp3_decoder = function(filepath, onloadedmetadata, onloadeddata) {
        var decoder = new modules.Decoder();
        decoder.decode("mp3", filepath, onloadedmetadata, onloadeddata);
    };
})();
