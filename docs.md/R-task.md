T("task")
=========
{kr}{timer} Task

## Description ##

```timbre
T("task", {do:5
}, function(count) {
  var synth = T("fami", {freq:880, mul:0.5});
  var adsr  = T("adsr", {a:100, d:100, s:0.5, r:1000}, synth).bang().play();
  this.wait(250);
  return [synth, adsr];
}, function(count, synth, adsr) {
  synth.freq.value *= Math.random() + 0.5;
  this.wait(400);
}, function(count, synth, adsr) {
  synth.freq = T("sin.kr", {freq:5, mul:10, add:synth.freq.value});
  adsr.release();
  this.wait(800);
}, function(count, synth, adsr) {
  adsr.pause();
  return 10;
}).on("ended", function(result) {
  console.log(result);
  this.stop();
}).start();
```

## See Also ##
- [T("shced)](./sched.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/task.js
