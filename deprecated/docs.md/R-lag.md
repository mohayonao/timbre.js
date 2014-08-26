T("lag")
========
{ar} Delay signal

## Description ##
en: `T("lag")` delays a signal by a certain amount of time.
ja: `T("lag")` は信号を遅延させます。

```timbre
var scale = [0,2,4,5,7,9,11,12];
var midicps = T("midicps");
var lag     = T("lag", {time:250, mul:1.5}, midicps);

T("tri", {freq:midicps, mul:0.25}).play();
T("tri", {freq:lag    , mul:0.15}).play();

T("interval", {interval:500}, function(count) {
  midicps.midi = scale[count % scale.length] + 69;
}).start();
```

## Properties ##
- `time` _(Number or timevalue)_
  - delay time (default: 100ms, range: 0 .. 1000)
  
## See Also ##
- [`T("delay")`](./delay.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/lag.js
