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
            
            fn(null, buf);
        };
        this.node.pipe(new Speaker({sampleRate:sys.samplerate}));
    };
    
    this.pause = function() {
        process.nextTick(this.node.emit.bind(this.node, "end"));
    };
}


module.exports = require("./timbre.dev").bind(TimbreNodePlayer);

var fs   = require("fs");
var lame = require("lame");

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

Decoder.ogg_decode = function(src, onloadedmetadata/*, onloadeddata*/) {
    onloadedmetadata(false);
};

Decoder.mp3_decode = function(src, onloadedmetadata, onloadeddata) {
    var decoder = new lame.Decoder();
    var bytes = [];
    var samplerate, channels, bufferL, bufferR, duration;
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
        bufferL = new Float32Array(length);
        if (channels === 2) {
            bufferR = new Float32Array(length);
        } else {
            bufferR = bufferL;
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
            bufferL   : bufferL,
            bufferR   : bufferR,
            duration  : duration
        });
        
        var i, imax, j, k = 1 / ((1 << (bitDepth-1)) - 1);
        if (channels === 2) {
            for (i = j = 0, imax = bufferL.length; i < imax; ++i) {
                bufferL[i] = data[j++] * k;
                bufferR[i] = data[j++] * k;
            }
        } else {
            for (i = 0, imax = bufferL.length; i < imax; ++i) {
                bufferL[i] = data[i] * k;
            }
        }
        
        onloadeddata();
    });
    fs.createReadStream(src).pipe(decoder);
};
