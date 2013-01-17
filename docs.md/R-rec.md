T("rec")
========
{ar}

```timbre
var BD = function() {
    BD.impl();
};
BD.impl = function() {

    var freq = T("param", {value:200}).linTo(10, 50);
    var synth = T("pulse", {freq:freq, mul:2.5});
    synth = T("lpf", {freq:100, Q:15}, synth);
    synth = T("clip", synth, T("pink", {mul:0.15}));
    
    synth = T("linen", {s:30, r:60, mul:0.5}, synth).on("ended", function() {
        this.pause();
        synth.stop();
    }).bang();
    
    synth = T("rec", {samplerate:11025}, synth).on("ended", function(buffer) {
        buffer = T("buffer", {buffer:buffer});
        BD.impl = function() {
            buffer.play();
            BD.impl = function() {
                buffer.bang();
            };
        };
        this.pause();
    }).start().play();
};

T("interval0", {interval:500}, BD).start();
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/rec.js
