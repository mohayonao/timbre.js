(function() {
    "use strict";
    
    function Decoder() {}
    
    Decoder.prototype.decode = function(src, onloadedmetadata, onloadeddata) {
        if (timbre.envtype === "browser") {
            if (typeof src === "string") {
                if (/\.wav$/.test(src)) {
                    return wav_decoder(src, onloadedmetadata, onloadeddata);
                }
            }
            
            if (webkit_decoder) {
                return webkit_decoder(src, onloadedmetadata, onloadeddata);
            } else if (moz_decoder) {
                return moz_decoder(src, onloadedmetadata, onloadeddata);
            }
            
        } else if (timbre.envtype === "node") {
            if (typeof src === "string") {
                if (/\.wav$/.test(src)) {
                    return wav_decoder(src, onloadedmetadata, onloadeddata);
                } else if (/\.ogg$/.test(src)) {
                    return node_ogg_decoder(src, onloadedmetadata, onloadeddata);
                } else if (/\.mp3$/.test(src)) {
                    return node_mp3_decoder(src, onloadedmetadata, onloadeddata);
                }
            }
        }
        onloadedmetadata(false);
    };
    timbre.modules.Decoder = Decoder;
    
    var getBinaryWithPath = (timbre.envtype === "browser") ? function(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
            if (xhr.status === 200) {
                callback(new Uint8Array(xhr.response));
            } else {
                callback(xhr.status + " " + xhr.statusText);
            }
        };
        xhr.send();
    }
    : (timbre.envtype === "node") ? function(path, callback) {
        var fs = require("fs");
        fs.readFile(path, function(err, data) {
            if (!err) {
                callback(new Uint8Array(data));
            } else {
                callback("can't read file");
            }
        });
    }
    : function(path, callback) {
        callback("no support");
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
    
    var wav_decoder = function(src, onloadedmetadata, onloadeddata) {
        getBinaryWithPath(src, function(data) {
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
            
            onloadeddata();
        });
    };
    
    
    var webkit_decoder = (function() {
        
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = new webkitAudioContext();
            var _decode = function(data, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
                if (typeof data === "string") {
                    return onloadeddata(false);
                }
                
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
                
                onloadeddata();
            };
            
            return function(src, onloadedmetadata, onloadeddata) {
                if (src instanceof File) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        _decode(new Uint8Array(e.target.result),
                                onloadedmetadata, onloadeddata);
                    };
                    reader.readAsArrayBuffer(src);
                } else {
                    getBinaryWithPath(src, function(data) {
                        _decode(data,
                                onloadedmetadata, onloadeddata);
                    });
                }
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(src, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
                var writeIndex = 0;
                
                var audio = new Audio(src);
                audio.volume = 0.0;
                audio.speed  = 4;
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
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                buffer[writeIndex++] = samples[i];
                            }
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
                    onloadeddata();
                }, false);
                audio.load();
            };
        }
    })();
    
    var node_ogg_decoder = function(src, onloadedmetadata/*, onloadeddata*/) {
        onloadedmetadata(false);
    };
    
    var node_mp3_decoder = function(src, onloadedmetadata, onloadeddata) {
        var fs   = require("fs");
        var lame = require("lame");
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

            
            onloadeddata();
        });
        fs.createReadStream(src).pipe(decoder);
    };
    
})();
