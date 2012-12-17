(function(timbre) {
    "use strict";
    
    function AudioFile(_args) {
        timbre.Object.call(this, _args);
        
        this._.isLooped   = false;
        this._.isReversed = false;
        this._.isLoaded = false;
        this._.isEnded  = true;
        this._.duration    = 0;
        this._.loadedTime  = 0;
        this._.currentTime = 0;
        this._.currentTimeIncr = this.cell * 1000 / timbre.samplerate;
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(AudioFile, timbre.Object);
    
    var $ = AudioFile.prototype;
    
    Object.defineProperties($, {
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
        isLooped: {
            set: function(value) {
                this._.isLooped = !!value;
            },
            get: function() {
                return this._.isLooped;
            }
        },
        isReversed: {
            set: function(value) {
                var _ = this._;
                _.isReversed = !!value;
                if (_.isReversed) {
                    if (_.phaseIncr > 0) {
                        _.phaseIncr *= -1;
                    }
                    if (_.phase === 0) {
                        _.phase = _.buffer.length + _.phaseIncr;
                    }
                } else {
                    if (_.phaseIncr < 0) {
                        _.phaseIncr *= -1;
                    }
                }
            },
            get: function() {
                return this._.isReversed;
            }
        },
        isLoaded: {
            get: function() {
                return this._.isLoaded;
            }
        },
        isEnded: {
            get: function() {
                return this._.isEnded;
            }
        },
        duration: {
            get: function() {
                return this._.duration;
            }
        },
        loadedTime: {
            get: function() {
                return this._.loadedTime;
            }
        },
        currentTime: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    if (0 <= value && value <= _.duration) {
                        _.phase = (value / 1000) * _.samplerate;
                        _.currentTime = value;
                    }
                }
            },
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.bang = function() {
        this._.phase      = 0;
        this._.isEnded    = false;
        this.emit("bang");
        return this;
    };
    
    $.slice = function(begin, end) {
        var _ = this._;
        var instance = timbre("audio");
        
        var isReversed = _.isReversed;
        if (typeof begin === "number" ){
            begin = (begin * 0.001 * _.samplerate)|0;
        } else {
            begin = 0;
        }
        if (typeof end === "number") {
            end   = (end   * 0.001 * _.samplerate)|0;
        } else {
            end = _.buffer.length;
        }
        if (begin > end) {
            var tmp = begin;
            begin = end;
            end   = tmp;
            isReversed = !isReversed;
        }
        
        instance._.samplerate = _.samplerate;
        instance._.buffer = _.buffer.subarray(begin, end);
        instance._.duration = (end - begin / _.samplerate) * 1000;
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (!_.isEnded && _.buffer) {
                var buffer = _.buffer;
                var phase  = _.phase;
                var phaseIncr = _.phaseIncr;
                var mul = _.mul, add = _.add;
                
                for (var i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                    phase += phaseIncr;
                }
                
                if (phase >= buffer.length) {
                    if (_.isLooped) {
                        phase = 0;
                        this.emit("looped");
                    } else {
                        _.isEnded = true;
                        this.emit("ended");
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        phase = buffer.length + phaseIncr;
                        this.emit("looped");
                    } else {
                        _.isEnded = true;
                        this.emit("ended");
                    }
                }
                _.phase = phase;
                _.currentTime += _.currentTimeIncr;
            }
        }
        
        return cell;
    };
    
    $.plot = function(opts) {
        var _ = this._;
        var buffer = _.buffer;
        if (_.plotFlush) {
            var data = new Float32Array(2048);
            var x = 0, xIncr = buffer.length / 2048;
            for (var i = 0; i < 2048; i++) {
                data[i] = buffer[x|0];
                x += xIncr;
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return AudioFile.__super__.plot.call(this, opts);
    };
    
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
    
    if (timbre.envtype === "browser") {
        // bowser
        (function() {
            $.load = function() {
                var self = this, _ = this._;
                
                var args = arguments, i = 0;
                var callback = function() {};
                
                if (typeof args[i] === "string") {
                    _.src = args[i++];
                } else if (args[i] instanceof Buffer) {
                    _.src = args[i++];
                }
                if (typeof args[i] === "function") {
                    callback = args[i++];
                }
                
                if (!_.src) {
                    callback.call(this, false);
                    return this;
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
                            then.call(this, decoderList, src, callback);
                            this.emit("loadstart");
                        } else {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", src, true);
                            xhr.responseType = "arraybuffer";
                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    then.call(self, decoderList,
                                              new Uint8Array(xhr.response), callback);
                                } else {
                                    var msg = xhr.status + " " + xhr.statusText;
                                    self.emit("error", msg);
                                    callback.call(self, false);
                                }
                            };
                            xhr.send();
                            this.emit("loadstart");
                        }
                    } else {
                        callback.call(this, false);
                    }
                } else if (src instanceof File) {
                    // TODO:
                    var reader = new FileReader();
                    reader.onload = function() {
                        then.call(this, null,
                                  new Uint8Array(xhr.response), callback);
                    };
                    reader.readAsArrayBuffer(src);
                    this.emit("loadstart");
                }
                return this;
            };
        })();
    } else if (timbre.envtype === "node") {
        // node.js
        (function() {
            var fs = require("fs");
            $.load = function() {
                var self = this, _ = this._;
                var args = arguments, i = 0;
                var callback = function() {};
                
                if (typeof args[i] === "string") {
                    _.src = args[i++];
                } else if (args[i] instanceof Buffer) {
                    _.src = args[i++];
                }
                if (typeof args[i] === "function") {
                    callback = args[i++];
                }
                
                if (!_.src) {
                    return this;
                }
                _.loadedTime = 0;
                
                var src = _.src;
                
                if (typeof src === "string") {
                    fs.exists(src, function(exists) {
                        if (!exists) {
                            var msg = "file does not exists";
                            self.emit("error", msg);
                            return callback.call(self, false);
                        }
                        
                        if (/.*\.ogg/.test(src)) {
                            then.call(self, [node_ogg_decoder], src, callback);
                        } else if (/.*\.mp3/.test(src)) {
                            then.call(self, [node_mp3_decoder], src, callback);
                        } else {
                            fs.readFile(src, function(err, data) {
                                if (err) {
                                    var msg = "can't read file";
                                    self.emit("error", msg);
                                    return callback.call(self, false);
                                }
                                var decoderList;
                                if (typeof src === "string") {
                                    if (/.*\.wav/.test(src)) {
                                        decoderList = [wav_decoder];
                                    }
                                }
                                then.call(self, decoderList,
                                          new Uint8Array(data), callback);
                            });
                        }
                    });
                    this.emit("loadstart");
                } else if (src instanceof Buffer) {
                    // TODO:
                    then.call(this, null,
                              new Uint8Array(src), callback);
                    this.emit("loadstart");
                }
                return this;
            };
            
            var node_ogg_decoder = function(filepath, done) {
                done(false);
            };
            
            var node_mp3_decoder = function(filepath, done) {
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
                    
                    done({
                        samplerate: samplerate,
                        buffer    : buffer,
                        duration  : duration
                    });

                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    self.emit("loadeddata");
                });
                fs.createReadStream(filepath).pipe(decoder);
            };
        })();
    }
    
    var then = function(decoderList, data, callback) {
        var self = this;
        
        // TODO:
        if (!decoderList) {
            return callback.call(self, false);
        }
        
        var done = function(result) {
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
                callback.call(self, true);
                self.emit("loadedmetadata");
            } else {
                iter();
            }
        };
        
        var iter = function() {
            if (decoderList.length > 0) {
                var decoder = decoderList.shift();
                if (decoder) {
                    decoder.call(self, data, done);
                } else {
                    iter();
                }
            } else {
                self.emit("error", "can't decode");
                callback.call(self, false);
            }
        };
        iter();
    };
    
    var webkit_decoder = (function() {
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = new webkitAudioContext();
            return function(data, done) {
                var samplerate, duration, buffer;
                try {
                    buffer = ctx.createBuffer(data.buffer, true);
                } catch (e) {
                    return done(false);
                }
                
                samplerate = ctx.sampleRate;
                buffer     = buffer.getChannelData(0);
                duration   = buffer.length / samplerate;
                
                done({
                    samplerate: samplerate,
                    buffer    : buffer,
                    duration  : duration
                });
                
                this._.isLoaded  = true;
                this._.plotFlush = true;
                this.emit("loadeddata");
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(data, done) {
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
                        done({
                            samplerate: samplerate,
                            buffer    : buffer,
                            duration  : duration
                        });
                    }, 1000);
                }, false);
                audio.addEventListener("ended", function() {
                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    self.emit("loadeddata");
                }, false);
                audio.addEventListener("error", function() {
                    self.emit("error");
                }, false);
                audio.load();
            };
        }
    })();
    
    var wav_decoder = function(data, done) {
        if (data[0] !== 0x52 || data[1] !== 0x49 ||
            data[2] !== 0x46 || data[3] !== 0x46) { // 'RIFF'
            // "HeaderError: not exists 'RIFF'"
            return done(false);
        }
        
        var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
        if (l1 + 8 !== data.length) {
            // "HeaderError: invalid data size"
            return done(false);
        }
        
        if (data[ 8] !== 0x57 || data[ 9] !== 0x41 ||
            data[10] !== 0x56 || data[11] !== 0x45) { // 'WAVE'
            // "HeaderError: not exists 'WAVE'"
            return done(false);
        }
        
        if (data[12] !== 0x66 || data[13] !== 0x6D ||
            data[14] !== 0x74 || data[15] !== 0x20) { // 'fmt '
            // "HeaderError: not exists 'fmt '"
            return done(false);
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
            return done(false);
        }
        
        var l2 = data[40] + (data[41]<<8) + (data[42]<<16) + (data[43]<<24);
        var duration = ((l2 / channels) >> 1) / samplerate;

        if (l2 > data.length - 44) {
            // "HeaderError: not exists data"
            return done(false);
        }
        
        var buffer = new Float32Array((duration * samplerate)|0);
        
        done({
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
        this.emit("loadeddata");
    };
    
    timbre.fn.register("audio", AudioFile);
})(timbre);
