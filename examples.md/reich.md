Reich
=====

```codemirror
timbre.rec(function(inlet) {

    var freqs = _.shuffle([440, 494, 523, 659, 440, 494, 523, 659]);

    var osc = T("osc", {wave:"sin(40)", mul:0.25});
    var env = T("env", {table:[1, [0, 250]]}, osc);

    var func = T(function(count) {
        return freqs[count % freqs.length];
    });
    osc.freq = func;

    T("timer", {delay:0, interval:240, limit:32}, func, env).on("limit", function() {
        inlet.done();
    }).start();
    
    inlet.append(env);
    
}).then(function(res) {

    var L = T("buffer", {buffer:res.L, isLooped:true});
    var R = T("buffer", {buffer:res.R, isLooped:true});
    
    var num = 400;
    var duration = L.duration;
    
    var pitch = (duration * (num - 1)) / (duration * num);

    R.pitch = pitch;
    
    T("+", L, R).play();
});
```
