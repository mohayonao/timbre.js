T("chorus")
===========
{ar}{stereo} Chorus

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/guitar.wav", function() {
  T("chorus", {delay:20, rate:4, depth:20, fb:0.5, mix:0.25}, this).play();
});
```

## Properties ##
- `type` _(String)_
  - modulation waveshape (default:`"sin"`, or `"tri"`)
- `delay` _(Number)_
  - delay time (default: 20msec, range: 0.5 .. 80)
- `rate` _(Number)_
  - modulation rate (default: 4hz, range: 0 .. 10)
- `depth` _(Number)_
  - modulation depth (default: 20, range: 0 .. 100)
- `fb` _(Number)_
  - feedback (default: 0.2, range: -1 .. 1)
- `wet` _(Number)_
  - dry/wet balance (default: 0.33, range: 0 .. 1)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/chorus.js
