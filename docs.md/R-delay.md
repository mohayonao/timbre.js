T("delay")
==========
{ar}{stereo} Delay signal

## Description ##
en: `T("delay")` delays a signal by a certain amount of time.
ja: `T("delay")` は信号を遅延させます。

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {

  var t = T("+sin", {freq:0.1, add:100, mul:25});
  
  T("delay", {time:t, fb:0.4, mix:0.25}, this).play();
  
});
```

## Properties ##
- `time` _(T-Object or timevalue)_
  - delay time (default: 100ms, range: 10 .. 1250)
- `fb` _(T-Object)_
  - feedback (default: 0.2, range: -1 .. 1)
- `cross` _(T-Object)_
  - cross delay
- `mix` _(Number)_
  - dry/wet balance (default: 0.33, range: 0 .. 1)
  
## See Also ##
- [`T("lag")`](./lag.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/delay.js
