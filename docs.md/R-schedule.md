T("schedule")
=============
{kr}{timer} schedules functions to be evaluated in the future

## Description ##

```timbre
var synth = T("OscGen", {wave:"sin(@4:10)", env:{type:"perc", r:500}, mul:0.25, poly:8});

var sched = T("schedule");

var func = [];
for (var i = 0; i < 21; i += 3) {
  var time = ((Math.random() * 8)|0) * 100 + 800;
  func[i] = function(i, time) {
    synth.noteOn(69 - 7 + i, 60);
    sched.sched(time, func[i]);
  }.bind(null, i, time);
  sched.sched(time, func[i]);
}
sched.start();

T("delay", {time:350, fb:0.8, mix:0.4}, synth).play();
```

### Properties ###
- `remain` _(ReadOnly Number)_
- `maxRemain` _(Number)_
- `isEmpty` _(ReadOnly Boolean)_

### Methods ###
- `sched(delta, func)`
- `schedAbs(time, func)`
- `advance(delta)`
- `clear()`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/schedule.js
