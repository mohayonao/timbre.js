module.exports = require("./timbre.dev").bind(require("./libs/TimbreNodePlayer"));

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
