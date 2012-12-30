Reich
=====

```timbre
timbre.rec(function(output) {
    var freqs = _.shuffle([440, 494, 523, 659, 440, 494, 523, 659]);
    var ms = timbre.timevalue("bpm120 l8");

    var osc = T("osc", {wave:"tri(25)", mul:0.5});
    var env = T("perc", {r:ms}, osc);

    var func = T(function(count) {
        return freqs[count % freqs.length];
    });
    osc.freq = func;

    T("interval", {interval:ms, timeout:ms*freqs.length}).on("ended", function() {
        output.done();
    }).append(func, env).start();
    
    output.send(env);
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
