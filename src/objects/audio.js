(function(timbre) {
    "use strict";
    
    timbre.fn.register("audio", function(_args) {
        var instance = timbre.apply(null, ["buffer"].concat(_args));
        
        timbre.fn.deferred(instance);
        
        instance._.isLoaded = false;
        instance._.isEnded  = true;
        instance._.loadedTime  = 0;
        
        Object.defineProperties(instance, {
            src: {
                set: function(value) {
                    var _ = this._;
                    if (_.value !== value) {
                        if (typeof value === "string") {
                            this._.src = value;
                            this._.isLoaded = false;
                        } else if (timbre.envtype === "browser" && value instanceof File) {
                            this._.src = value;
                            this._.isLoaded = false;
                        }
                    }
                },
                get: function() {
                    return this._.src;
                }
            },
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
            return timbre.fn.nop;
        }
    })();
    
    
    function getLoadFunctionForBrowser() {
        return function() {
            var self = this, _ = this._;
            
            if (_.deferred.isResolve) {
                // throw error ??
                return this;
            }
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            } else if (args[i] instanceof File) {
                _.src = args[i++];
            }
            if (!_.src) {
                // throw error ??
                return this;
            }
            
            var dfd = _.deferred;
            
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
                    var noUseByteData = false;
                    if (/.*\.wav/.test(src)) {
                        decoderList = [wav_decoder];
                    } else {
                        if (webkit_decoder) {
                            decoderList = [webkit_decoder];
                        } else if (moz_decoder) {
                            decoderList = [moz_decoder];
                            noUseByteData = true;
                        }
                    }
                    
                    if (noUseByteData) {
                        then.call(this, decoderList, src, dfd);
                        this._.emit("load");
                    } else {
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", src, true);
                        xhr.responseType = "arraybuffer";
                        xhr.onload = function() {
                            if (xhr.status === 200) {
                                then.call(self, decoderList,
                                          new Uint8Array(xhr.response), dfd);
                            } else {
                                var msg = xhr.status + " " + xhr.statusText;
                                self._.emit("error", msg);
                                dfd.reject();
                            }
                        };
                        xhr.send();
                        this._.emit("load");
                    }
                } else {
                    dfd.reject();
                }
            } else if (src instanceof File) {
                // TODO:
                var reader = new FileReader();
                reader.onload = function() {
                    then.call(this, null,
                              new Uint8Array(xhr.response), dfd);
                };
                reader.readAsArrayBuffer(src);
                this._.emit("load");
            }
            return this;
        };
    }
    
    
    function getLoadFunctionForNodeJS() {
        return function() {
            var fs = require("fs");
            var self = this, _ = this._;
            
            if (_.deferred.isResolve) {
                // throw error ??
                return this;
            }
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            }
            if (!_.src) {
                // throw error ??
                return this;
            }
            
            var dfd = _.deferred;
            
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
                    } else {
                        fs.readFile(src, function(err, data) {
                            if (err) {
                                var msg = "can't read file";
                                self._.emit("error", msg);
                                return dfd.reject();
                            }
                            var decoderList;
                            if (typeof src === "string") {
                                if (/.*\.wav/.test(src)) {
                                    decoderList = [wav_decoder];
                                }
                            }
                            then.call(self, decoderList,
                                      new Uint8Array(data), dfd);
                        });
                    }
                });
                this._.emit("load");
            }
            return this;
        };
    }
    
    
    
    var deinterleave = function(list) {
        var result = new list.constructor(list.length>>1);
        var i = list.length, j = result.length;
        if (i % 2) {
            i -= 1;
            j |= 0;
        }
        while (j) {
            result[--j] = (list[--i] + list[--i]) * 0.5;
        }
        return result;
    };
    
    var _24bit_to_32bit = function(uint8) {
        var b0, b1, b2, bb, x;
        var int32 = new Int32Array(uint8.length / 3);
        for (var i = 0, imax = uint8.length, j = 0; i < imax; ) {
            b0 = uint8[i++] ,b1 = uint8[i++], b2 = uint8[i++];
            bb = b0 + (b1 << 8) + (b2 << 16);
            x = (bb & 0x800000) ? -((bb^0xFFFFFF)+1) : bb;
            int32[j++] = x;
        }
        return int32;
    };
    
    
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
            self._.emit("loadeddata");
            dfd.resolve();
        };
        
        var iter = function() {
            if (decoderList.length > 0) {
                var decoder = decoderList.shift();
                if (decoder) {
                    decoder.call(self, data, onloadedmetadata, onloadeddata);
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
            var ctx = new webkitAudioContext();
            return function(data, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
                try {
                    buffer = ctx.createBuffer(data.buffer, true);
                } catch (e) {
                    return onloadedmetadata(false);
                }
                
                samplerate = ctx.sampleRate;
                buffer     = buffer.getChannelData(0);
                duration   = buffer.length / samplerate;
                
                onloadedmetadata({
                    samplerate: samplerate,
                    buffer    : buffer,
                    duration  : duration
                });
                
                this._.isLoaded  = true;
                this._.plotFlush = true;
                
                onloadeddata();
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(data, onloadedmetadata, onloadeddata) {
                var self = this;
                var samplerate, duration, buffer;
                var writeIndex = 0;
                
                var audio = new Audio(data);
                audio.volume = 0.0;
                audio.speed  = 2;
                audio.addEventListener("loadedmetadata", function() {
                    samplerate = audio.mozSampleRate;
                    duration = audio.duration;
                    buffer = new Float32Array((audio.duration * samplerate)|0);
                    if (audio.mozChannels === 2) {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; i += 2) {
                                buffer[writeIndex++] = (samples[i] + samples[i+1]) * 0.5;
                            }
                            self._.loadedTime = samples.length * 1000 / samplerate;
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                buffer[writeIndex++] = samples[i];
                            }
                            self._.loadedTime = samples.length * 1000 / samplerate;
                        }, false);
                    }
                    audio.play();
                    setTimeout(function() {
                        onloadedmetadata({
                            samplerate: samplerate,
                            buffer    : buffer,
                            duration  : duration
                        });
                    }, 1000);
                }, false);
                audio.addEventListener("ended", function() {
                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    onloadeddata();
                }, false);
                audio.addEventListener("error", function() {
                    self._.emit("error");
                }, false);
                audio.load();
            };
        }
    })();
    
    var wav_decoder = function(data, onloadedmetadata, onloadeddata) {
        if (data[0] !== 0x52 || data[1] !== 0x49 ||
            data[2] !== 0x46 || data[3] !== 0x46) { // 'RIFF'
            // "HeaderError: not exists 'RIFF'"
            return onloadedmetadata(false);
        }
        
        var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
        if (l1 + 8 !== data.length) {
            // "HeaderError: invalid data size"
            return onloadedmetadata(false);
        }
        
        if (data[ 8] !== 0x57 || data[ 9] !== 0x41 ||
            data[10] !== 0x56 || data[11] !== 0x45) { // 'WAVE'
            // "HeaderError: not exists 'WAVE'"
            return onloadedmetadata(false);
        }
        
        if (data[12] !== 0x66 || data[13] !== 0x6D ||
            data[14] !== 0x74 || data[15] !== 0x20) { // 'fmt '
            // "HeaderError: not exists 'fmt '"
            return onloadedmetadata(false);
        }
        
        // var byteLength = data[16] + (data[17]<<8) + (data[18]<<16) + (data[19]<<24);
        // var linearPCM  = data[20] + (data[21]<<8);
        var channels   = data[22] + (data[23]<<8);
        var samplerate = data[24] + (data[25]<<8) + (data[26]<<16) + (data[27]<<24);
        // var dataSpeed  = data[28] + (data[29]<<8) + (data[30]<<16) + (data[31]<<24);
        // var blockSize  = data[32] + (data[33]<<8);
        var bitSize    = data[34] + (data[35]<<8);
        
        if (data[36] !== 0x64 || data[37] !== 0x61 ||
            data[38] !== 0x74 || data[39] !== 0x61) { // 'data'
            // "HeaderError: not exists 'data'"
            return onloadedmetadata(false);
        }
        
        var l2 = data[40] + (data[41]<<8) + (data[42]<<16) + (data[43]<<24);
        var duration = ((l2 / channels) >> 1) / samplerate;

        if (l2 > data.length - 44) {
            // "HeaderError: not exists data"
            return onloadedmetadata(false);
        }
        
        var buffer = new Float32Array((duration * samplerate)|0);
        
        onloadedmetadata({
            samplerate: samplerate,
            buffer    : buffer,
            duration  : duration
        });
        
        if (bitSize === 8) {
            data = new Int8Array(data.buffer, 44);
        } else if (bitSize === 16) {
            data = new Int16Array(data.buffer, 44);
        } else if (bitSize === 32) {
            data = new Int32Array(data.buffer, 44);
        } else if (bitSize === 24) {
            data = _24bit_to_32bit(new Uint8Array(data.buffer, 44));
        }
        
        if (channels === 2) {
            data = deinterleave(data);
        }
        
        var k = 1 / ((1 << (bitSize-1)) - 1);
        for (var i = buffer.length; i--; ) {
            buffer[i] = data[i] * k;
        }
        
        this._.isLoaded  = true;
        this._.plotFlush = true;
        
        onloadeddata();
    };
    
    var node_ogg_decoder = function(filepath, onloadedmetadata) {
        onloadedmetadata(false);
    };
    
    var node_mp3_decoder = function(filepath, onloadedmetadata, onloadeddata) {
        var fs   = require("fs");
        var lame = require("lame");
        var self = this;
        var decoder = new lame.Decoder();
        var bytes = [];
        var samplerate, duration, buffer;
        var channels, bitDepth;
        
        decoder.on("format", function(format) {
            // console.log("format", format);
            samplerate = format.sampleRate;
            channels   = format.channels;
            bitDepth   = format.bitDepth;
        });
        decoder.on("data", function(data) {
            for (var i = 0, imax = data.length; i < imax; ++i) {
                bytes.push(data[i]);
            }
        });
        decoder.on("end", function() {
            var length = bytes.length / channels / (bitDepth / 8);
            
            duration = length / samplerate;
            buffer = new Float32Array(length);
            
            var uint8 = new Uint8Array(bytes);
            var data;
            if (bitDepth === 16) {
                data = new Int16Array(uint8.buffer);
            } else if (bitDepth === 8) {
                data = new Int8Array(uint8.buffer);
            } else if (bitDepth === 24) {
                data = _24bit_to_32bit(uint8.buffer);
            }
            
            if (channels === 2) {
                data = deinterleave(data);
            }
            
            var k = 1 / ((1 << (bitDepth-1)) - 1);
            for (var i = buffer.length; i--; ) {
                buffer[i] = data[i] * k;
            }
            
            onloadedmetadata({
                samplerate: samplerate,
                buffer    : buffer,
                duration  : duration
            });

            self._.isLoaded  = true;
            self._.plotFlush = true;
            
            onloadeddata();
        });
        fs.createReadStream(filepath).pipe(decoder);
    };
})(timbre);
