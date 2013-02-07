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
if (!Readable) Readable = require("readable-stream/readable");

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

module.exports = TimbreNodePlayer;
