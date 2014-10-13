(function(T) {
    "use strict";

    function Decoder() {}

    Decoder.prototype.decode = function(src, onloadedmetadata, onloadeddata) {
        if (typeof src === "string") {
            if (/\.wav$/.test(src)) {
                return Decoder.wav_decode(src, onloadedmetadata, onloadeddata);
            } else if (Decoder.ogg_decode && /\.ogg$/.test(src)) {
                return Decoder.ogg_decode(src, onloadedmetadata, onloadeddata);
            } else if (Decoder.mp3_decode && /\.mp3$/.test(src)) {
                return Decoder.mp3_decode(src, onloadedmetadata, onloadeddata);
            }
        } else if (typeof src === "object") {
            if (src.type === "wav") {
                return Decoder.wav_decode(src.data, onloadedmetadata, onloadeddata);
            } else if (Decoder.ogg_decode && src.type === "ogg") {
                return Decoder.ogg_decode(src.data, onloadedmetadata, onloadeddata);
            } else if (Decoder.mp3_decode && src.type === "mp3") {
                return Decoder.mp3_decode(src.data, onloadedmetadata, onloadeddata);
            }
        }
        if (Decoder.webkit_decode) {
            if (typeof src === "object") {
                return Decoder.webkit_decode(src.data||src, onloadedmetadata, onloadeddata);
            } else {
                return Decoder.webkit_decode(src, onloadedmetadata, onloadeddata);
            }
        } else if (Decoder.moz_decode) {
            return Decoder.moz_decode(src, onloadedmetadata, onloadeddata);
        }
        onloadedmetadata(false);
    };
    T.modules.Decoder = Decoder;

    if (T.envtype === "browser") {
        Decoder.getBinaryWithPath = function(path, callback) {
            T.fn.fix_iOS6_1_problem(true);

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path);
            xhr.responseType = "arraybuffer";
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.response) {
                        callback(new Uint8Array(xhr.response));
                    } else if (xhr.responseBody !== undefined) {
                        /*global VBArray:true */
                        callback(new Uint8Array(VBArray(xhr.responseBody).toArray()));
                        /*global VBArray:false */
                    }
                    T.fn.fix_iOS6_1_problem(false);
                }
            };
            xhr.send();
        };
    } else {
        Decoder.getBinaryWithPath = function(path, callback) {
            callback("no support");
        };
    }

    var _24bit_to_32bit = function(uint8) {
        var b0, b1, b2, bb, x;
        var int32 = new Int32Array(uint8.length / 3);
        for (var i = 0, imax = uint8.length, j = 0; i < imax; ) {
            b0 = uint8[i++];
            b1 = uint8[i++];
            b2 = uint8[i++];
            bb = b0 + (b1 << 8) + (b2 << 16);
            x = (bb & 0x800000) ? bb - 16777216 : bb;
            int32[j++] = x;
        }
        return int32;
    };

    Decoder.wav_decode = (function() {
        var _decode = function(data, onloadedmetadata, onloadeddata) {
            if (String.fromCharCode(data[0], data[1], data[2], data[3]) !== "RIFF") {
                return onloadedmetadata(false);
            }

            var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
            if (l1 + 8 !== data.length) {
                return onloadedmetadata(false);
            }

            if (String.fromCharCode(data[8], data[9], data[10], data[11]) !== "WAVE") {
                return onloadedmetadata(false);
            }

            if (String.fromCharCode(data[12], data[13], data[14], data[15]) !== "fmt ") {
                return onloadedmetadata(false);
            }

            var channels   = data[22] + (data[23]<<8);
            var samplerate = data[24] + (data[25]<<8) + (data[26]<<16) + (data[27]<<24);
            var bitSize    = data[34] + (data[35]<<8);

            var i = 36;
            while (i < data.length) {
                if (String.fromCharCode(data[i], data[i+1], data[i+2], data[i+3]) === "data") {
                    break;
                }
                i += 1;
            }
            if (i >= data.length) {
                return onloadedmetadata(false);
            }
            i += 4;

            var l2 = data[i] + (data[i+1]<<8) + (data[i+2]<<16) + (data[i+3]<<24);
            var duration = ((l2 / channels) >> 1) / samplerate;
            i += 4;

            if (l2 > data.length - i) {
                return onloadedmetadata(false);
            }

            var mixdown, bufferL, bufferR;
            mixdown = new Float32Array((duration * samplerate)|0);
            if (channels === 2) {
                bufferL = new Float32Array(mixdown.length);
                bufferR = new Float32Array(mixdown.length);
            }

            onloadedmetadata({
                samplerate: samplerate,
                channels  : channels,
                buffer    : [mixdown, bufferL, bufferR],
                duration  : duration
            });

            if (bitSize === 8) {
                data = new Int8Array(data.buffer, i);
            } else if (bitSize === 16) {
                data = new Int16Array(data.buffer, i);
            } else if (bitSize === 32) {
                data = new Int32Array(data.buffer, i);
            } else if (bitSize === 24) {
                data = _24bit_to_32bit(new Uint8Array(data.buffer, i));
            }

            var imax, j, k = 1 / ((1 << (bitSize-1)) - 1), x;
            if (channels === 2) {
                for (i = j = 0, imax = mixdown.length; i < imax; ++i) {
                    x =  bufferL[i] = data[j++] * k;
                    x += bufferR[i] = data[j++] * k;
                    mixdown[i] = x * 0.5;
                }
            } else {
                for (i = 0, imax = mixdown.length; i < imax; ++i) {
                    mixdown[i] = data[i] * k;
                }
            }

            onloadeddata();
        };

        return function(src, onloadedmetadata, onloadeddata) {
            if (typeof src === "string") {
                Decoder.getBinaryWithPath(src, function(data) {
                    _decode(data, onloadedmetadata, onloadeddata);
                });
            } else {
                _decode(src, onloadedmetadata, onloadeddata);
            }
        };
    })();

    Decoder.webkit_decode = (function() {
        if (typeof T.fn._audioContext !== "undefined") {
            var ctx = T.fn._audioContext;
            var _decode = function(data, onloadedmetadata, onloadeddata) {
                var samplerate, channels, bufferL, bufferR, duration;

                if (typeof data === "string") {
                    return onloadeddata(false);
                }

                var buffer;
                try {
                    buffer = ctx.createBuffer(data.buffer, false);
                } catch (e) {
                    return onloadedmetadata(false);
                }

                samplerate = ctx.sampleRate;
                channels   = buffer.numberOfChannels;
                if (channels === 2) {
                    bufferL = buffer.getChannelData(0);
                    bufferR = buffer.getChannelData(1);
                } else {
                    bufferL = bufferR = buffer.getChannelData(0);
                }
                duration = bufferL.length / samplerate;

                var mixdown = new Float32Array(bufferL);
                for (var i = 0, imax = mixdown.length; i < imax; ++i) {
                    mixdown[i] = (mixdown[i] + bufferR[i]) * 0.5;
                }

                onloadedmetadata({
                    samplerate: samplerate,
                    channels  : channels,
                    buffer    : [mixdown, bufferL, bufferR],
                    duration  : duration
                });

                onloadeddata();
            };

            return function(src, onloadedmetadata, onloadeddata) {
                /*global File:true */
                if (src instanceof File) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        _decode(new Uint8Array(e.target.result),
                                onloadedmetadata, onloadeddata);
                    };
                    reader.readAsArrayBuffer(src);
                } else if (typeof src === "string") {
                    Decoder.getBinaryWithPath(src, function(data) {
                        _decode(data, onloadedmetadata, onloadeddata);
                    });
                } else {
                    _decode(src, onloadedmetadata, onloadeddata);
                }
                /*global File:false */
            };
        }
    })();

    Decoder.moz_decode = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(src, onloadedmetadata, onloadeddata) {
                var samplerate, channels, mixdown, bufferL, bufferR, duration;
                var writeIndex = 0;

                var audio = new Audio(src);
                audio.volume = 0.0;
                audio.addEventListener("loadedmetadata", function() {
                    samplerate = audio.mozSampleRate;
                    channels   = audio.mozChannels;
                    duration   = audio.duration;
                    mixdown = new Float32Array((audio.duration * samplerate)|0);
                    if (channels === 2) {
                        bufferL = new Float32Array((audio.duration * samplerate)|0);
                        bufferR = new Float32Array((audio.duration * samplerate)|0);
                    }
                    if (channels === 2) {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var x, samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; i += 2) {
                                x =  bufferL[writeIndex] = samples[i  ];
                                x += bufferR[writeIndex] = samples[i+1];
                                mixdown[writeIndex] = x * 0.5;
                                writeIndex += 1;
                            }
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                mixdown[i] = samples[i];
                                writeIndex += 1;
                            }
                        }, false);
                    }
                    audio.play();
                    setTimeout(function() {
                        onloadedmetadata({
                            samplerate: samplerate,
                            channels  : channels,
                            buffer    : [mixdown, bufferL, bufferR],
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
})(timbre);
