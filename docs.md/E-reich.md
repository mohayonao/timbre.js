Reich
=====

```timbre
timbre.rec(function(output) {
  var midis = [69, 71, 72, 76, 69, 71, 72, 76].scramble();
  var msec  = timbre.timevalue("bpm120 l8");
  var synth = T("OscGen", {env:T("perc", {r:msec, ar:true})});
  
  T("interval", {interval:msec}, function(count) {
    if (count < midis.length) {
      synth.noteOn(midis[count], 100);
    } else {
      output.done();
    }
  }).start();
    
  output.send(synth);
}).then(function(result) {
  var L = T("buffer", {buffer:result, loop:true});
  var R = T("buffer", {buffer:result, loop:true});
  
  var num = 400;
  var duration = L.duration;
  
  R.pitch = (duration * (num - 1)) / (duration * num);

  T("delay", {time:"bpm120 l16", fb:0.1, cross:true},
    T("pan", {pos:-0.6}, L), T("pan", {pos:+0.6}, R)
  ).play();
});
```

using: [subcollider.js](http://mohayonao.github.com/subcollider.js/)
