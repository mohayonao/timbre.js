T("delay")
==========
{ar} Delay signal

## Description ##
###### en ######
`T("delay")` delays a signal by a certain amount of time.
###### ja ######
`T("delay")` は信号を遅延させます。
###### -- ######

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
  
  T("delay", {time:"80ms", fb:0.4, mix:0.25}, this).play();
  
});
```

## Properties ##
- `time` _(Number or timevalue)_
  - delay time (default: 100ms, range: 10 .. 1250)
- `fb` _(T-Object)_
  - feedback (default: 0.2, range: -1 .. 1)
- `mix` _(Number)_
  - dry/wet balance (default: 0.33, range: 0 .. 1)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/delay.js
