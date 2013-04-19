"use strict";

var Readable = require("stream").Readable;

// node-speaker
//   Output raw PCM audio data to the speakers
//   https://github.com/TooTallNate/node-speaker
//   npm install speaker
var Speaker = require("speaker");

// node v0.8.x compat
// readable-stream
//   https://github.com/isaacs/readable-stream
//   npm install readable-stream
if (!Readable) {
    Readable = require("readable-stream/readable");
}

function TimbreNodePlayer(sys) {
    
    this.maxSamplerate     = 48000;
    this.defaultSamplerate = 44100;
    this.env = "node";
    this.node = null;
    
    this.play = function() {
        this.node = new Readable();
        this.node._read = function(n, fn) {
            var inL = sys.strmL, inR = sys.strmR;
            var buf = new Buffer(n);
            
            var i, j = 0;
            var imax = inL.length;
            
            n = (n >> 2) / sys.streamsize;
            while (n--) {
                sys.process();
                for (i = 0; i < imax; ++i) {
                    buf.writeInt16LE((inL[i] * 32760)|0, j);
                    j += 2;
                    buf.writeInt16LE((inR[i] * 32760)|0, j);
                    j += 2;
                }
            }

            if (fn) {
                fn(null, buf);
            } else {
                this.push(buf);
            }
        };
        this.node.pipe(new Speaker({sampleRate:sys.samplerate}));
    };
    
    this.pause = function() {
        process.nextTick(this.node.emit.bind(this.node, "end"));
    };
}


module.exports = require("./timbre.dev").bind(TimbreNodePlayer);

var fs   = require("fs");
var lame = (function() {
    try { return require("lame"); } catch (e) {}
})();
var ogg = (function() {
    try { return require("ogg"); } catch (e) {}
})();
var vorbis = (function() {
    try { return require("vorbis"); } catch (e) {}
})();

var Decoder = timbre.modules.Decoder;

Decoder.getBinaryWithPath = function(path, callback) {
    fs.readFile(path, function(err, data) {
        if (!err) {
            callback(new Uint8Array(data));
        } else {
            callback("can't read file");
        }
    });
};

Decoder.ogg_decode = ogg && vorbis && function(src, onloadedmetadata/*, onloadeddata*/) {
    /*
    var decoder = new ogg.Decoder();
    
    decoder.on("stream", function (stream) {
        var vd = new vorbis.Decoder();
        
        // the "format" event contains the raw PCM format
        vd.on('format', function (format) {
            // send the raw PCM data to stdout
            vd.pipe(process.stdout);
        });

        // an "error" event will get emitted if the stream is not a Vorbis stream
        // (i.e. it could be a Theora video stream instead)
        vd.on('error', function (err) {
            // maybe try another decoder...
        });
        
        stream.pipe(vd);
    });
    
    fs.createReadStream(src).pipe(decoder);
    */
    onloadedmetadata(false);
};

Decoder.mp3_decode = lame && function(src, onloadedmetadata, onloadeddata) {
    var decoder = new lame.Decoder();
    var bytes = [];
    var samplerate, channels, mixdown, bufferL, bufferR, duration;
    var bitDepth;
    
    decoder.on("format", function(format) {
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
        mixdown = new Float32Array(length);
        if (channels === 2) {
            bufferL = new Float32Array(length);
            bufferR = new Float32Array(length);
        }
        
        var uint8 = new Uint8Array(bytes);
        var data;
        if (bitDepth === 16) {
            data = new Int16Array(uint8.buffer);
        } else if (bitDepth === 8) {
            data = new Int8Array(uint8.buffer);
        } else if (bitDepth === 24) {
            data = _24bit_to_32bit(uint8.buffer);
        }
        
        onloadedmetadata({
            samplerate: samplerate,
            channels  : channels,
            buffer    :  [mixdown, bufferL, bufferR],
            duration  : duration
        });
        
        var i, imax, j, k = 1 / ((1 << (bitDepth-1)) - 1), x;
        if (channels === 2) {
            for (i = j = 0, imax = mixdown.length; i < imax; ++i) {
                x  = bufferL[i] = data[j++] * k;
                x += bufferR[i] = data[j++] * k;
                mixdown[i] = x * 0.5;
            }
        } else {
            for (i = 0, imax = mixdown.length; i < imax; ++i) {
                bufferL[i] = data[i] * k;
            }
        }
        
        onloadeddata();
    });
    fs.createReadStream(src).pipe(decoder);
};
