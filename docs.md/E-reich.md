Reich
=====

```timbre
timbre.rec(function(output) {
    var notes = _.shuffle([69, 71, 72, 76, 69, 71, 72, 76]);
    var msec  = timbre.timevalue("bpm120 l8");
    var synth = T("OscGen", {wave:"tri(25)", env:{type:"perc", r:msec}, mul:0.5});
    
    T("interval", {interval:msec, timeout:msec*notes.length}, function(count) {
        synth.noteOn(notes[count % notes.length], 80);
    }).on("ended", function() {
        output.done();
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
