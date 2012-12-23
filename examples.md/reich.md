Reich
=====

```codemirror
timbre.rec(function(output) {
    
    var freqs = _.shuffle([440, 494, 523, 659, 440, 494, 523, 659]);
    var ms = timbre.utils.timevalue("bpm120 l8");

    var osc = T("osc", {wave:"tri(25)"});
    var env = T("perc", {r:ms}, osc);

    var func = T(function(count) {
        return freqs[count % freqs.length];
    });
    osc.freq = func;

    T("timer", {interval:ms, duration:ms*freqs.length}).on("ended", function() {
        output.done();
    }).append(func, env).start();
    
    output.send(env);
    
}).then(function(res) {

    var L = T("buffer", {buffer:res, isLooped:true});
    var R = T("buffer", {buffer:res, isLooped:true});
    
    var num = 400;
    var duration = L.duration;
    
    R.pitch = (duration * (num - 1)) / (duration * num);
    
    T("pan", {value:-1}, L).play();
    T("pan", {value:+1}, R).play();

});
```
