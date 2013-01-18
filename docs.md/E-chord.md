Chords Work
===========

```timbre
var pattern = new sc.Pshuf(sc.series(12), Infinity);
var scale   = new sc.Scale.major();
var chords  = [
    [0, 1, 4], [0, 1, 5], [0, 1, 6],
    [0, 2, 6], [0, 2, 5], [0, 2, 4],
    [0, 3, 6], [0, 3, 5], [0, 3, 4]
];

var msec = timbre.timevalue("BPM120 L16");
var env  = T("env", {table:[0.2, [1, msec * 48], [0.2, msec * 16]]});
var gen  = T("OscGen", {wave:"saw", env:env, mul:0.5});

var synth = gen;
synth = T("+saw", {freq:(msec * 2)+"ms", add:0.5, mul:0.5}, synth);
synth = T("lpf" , {cutoff:800, Q:12}, synth);
synth.play();

T("interval", {interval:msec * 64}, function() {
    var root = pattern.next();
    chords.choose().forEach(function(i) {
        gen.noteOn(scale.wrapAt(root + i) +60, 80); 
    });
}).start();
```

using: [subcollider.js](http://mohayonao.github.com/subcollider.js)

