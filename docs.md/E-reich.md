Reich
=====

```timbre
timbre.rec(function(output) {
    var midis = _.shuffle([69, 71, 72, 76, 69, 71, 72, 76]);
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
    var L = T("buffer", {buffer:buffer, isLooped:true});
    var R = T("buffer", {buffer:buffer, isLooped:true});
    
    var num = 400;
    var duration = L.duration;
    
    R.pitch = (duration * (num - 1)) / (duration * num);
    
    T("pan", {value:-0.4}, L).play();
    T("pan", {value:+0.4}, R).play();
});
```
