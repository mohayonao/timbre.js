T("reverb")
==========
{ar}{stereo} A reverb

## Description ##
Port of the [Freeverb](https://ccrma.stanford.edu/~jos/pasp/Freeverb.html) Schrodoer/Moorer reverb model.

```timbre
var src = "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
  
  T("reverb", {room:0.9, damp:0.2, mix:0.45}, this).play();
  
});
```

## Properties ##
- `room` _(Number)_
  - room size (default: 0.5)
- `damp` _(Number)_
  - reverb HF damp (default: 0.5)
- `mix` _(Number)_
  - dry/wet balance (default: 0.33)

_Valid parameter range from 0 to 1. Values outside this range are clipped by the object._

## See Also ##
- [`T("delay")`](./delay.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/reverb.js
