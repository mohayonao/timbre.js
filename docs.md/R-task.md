T("task")
=========
{kr}{timer} Task

## Description ##

```timbre
T("task", {do:5, init:function() {
  return { freq:[440, 466, 493, 523, 554] };
}
}, function(count, args) {
  args.synth = T("fami", {freq:args.freq[count], mul:0.5});
  args.adsr  = T("adsr", {a:100, d:100, s:0.8, r:1000}, args.synth).bang().play();
  this.wait(250);
}, function(count, args) {
  args.synth.freq.value *= 2;
  this.wait(400);
}, function(count, args) {
  args.synth.freq = T("sin.kr", {freq:5, mul:10, add:args.synth.freq.value});
  args.adsr.release();
  this.wait(800);
}, function(count, args) {
  args.adsr.pause();
}).on("ended", function() {
  this.stop();
}).start();
```

## See Also ##
- [T("shced)](./sched.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/task.js
