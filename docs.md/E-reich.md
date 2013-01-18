Reich
=====

```timbre
timbre.rec(function(output) {
    var midis = [69, 71, 72, 76, 69, 71, 72, 76].scramble();
    var msec  = timbre.timevalue("bpm120 l8");
    var synth = T("OscGen", {env:{type:"perc", r:msec}});
    
    T("interval", {interval:msec}, function(count) {
        if (count < midis.length) {
            synth.noteOn(midis[count], 100);
        } else {
            output.done();
        }
    }).start();
    
    output.send(synth);
}).then(function(buffer) {
    var L = T("buffer", {buffer:buffer, loop:true});
    var R = T("buffer", {buffer:buffer, loop:true});
    
    var num = 400;
    var duration = L.duration;
    
    R.pitch = (duration * (num - 1)) / (duration * num);
    
    T("pan", {value:-0.4}, L).play();
    T("pan", {value:+0.4}, R).play();
});
```

using: [subcollider.js](http://mohayonao.github.com/subcollider.js/)
